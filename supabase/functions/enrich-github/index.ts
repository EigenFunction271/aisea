import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { z } from "npm:zod@3.23.8";
import { getUserIdFromRequest, createAdminClient } from "../_shared/auth.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

declare const Deno: {
  env: { get(key: string): string | undefined };
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
};

// ── AI library detection lists (github.md §5.3) ───────────────────────────

const PYTHON_AI_LIBS = [
  "openai", "anthropic", "langchain", "llama-index", "transformers",
  "pydantic", "instructor", "litellm", "chromadb", "faiss-cpu",
  "sentence-transformers", "diffusers", "accelerate", "google-generativeai",
];

const NODE_AI_LIBS = [
  "openai", "@anthropic-ai/sdk", "langchain", "llamaindex", "ai",
  "@vercel/ai", "chromadb", "hnswlib-node", "@google/generative-ai",
];

const ALL_AI_LIBS = [...new Set([...PYTHON_AI_LIBS, ...NODE_AI_LIBS])];

const FOCUS_AREAS = [
  "agents", "RAG", "fine-tuning", "vision", "voice",
  "LLM-infra", "data-pipelines", "evals", "tools-integrations",
] as const;

/** Limit parallel repo work (GitHub raw + Gemini burst). */
const REPO_ENRICH_CONCURRENCY = 5;
/** Max README scoring Gemini calls per enrichment run (cost / rate limit). */
const MAX_README_GEMINI_CALLS = 8;
/** Parallel Supabase project row updates after bulk insert. */
const PROJECT_UPDATE_CONCURRENCY = 6;

// ── Types ─────────────────────────────────────────────────────────────────

type GitHubRepo = {
  name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  pushed_at: string;
};

type RepoEnrichment = {
  repo: GitHubRepo;
  detectedLibs: string[];
  readmeScore: number | null;
  readmeSummary: string | null;
};

// ── Helpers ───────────────────────────────────────────────────────────────

function jsonResponse(
  body: unknown,
  status = 200,
  cors: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...cors },
  });
}

function activityStatus(
  lastPushIso: string
): "active" | "occasional" | "dormant" {
  const daysAgo =
    (Date.now() - new Date(lastPushIso).getTime()) / (1000 * 60 * 60 * 24);
  if (daysAgo <= 30) return "active";
  if (daysAgo <= 90) return "occasional";
  return "dormant";
}

function detectLibs(depContent: string): string[] {
  return ALL_AI_LIBS.filter((lib) => depContent.includes(lib));
}

async function mapInBatches<T, R>(
  items: T[],
  batchSize: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const part = await Promise.all(batch.map(fn));
    out.push(...part);
  }
  return out;
}

async function safeFetch(
  url: string,
  headers: Record<string, string>
): Promise<string | null> {
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

// ── Gemini helpers ────────────────────────────────────────────────────────

async function callGemini(
  prompt: string,
  geminiKey: string
): Promise<string | null> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 256, temperature: 0.1 },
        }),
      }
    );
    if (!res.ok) {
      console.error("[enrich-github] Gemini error:", res.status, await res.text());
      return null;
    }
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  } catch (err) {
    console.error("[enrich-github] Gemini fetch failed:", err);
    return null;
  }
}

function stripCodeFence(text: string): string {
  return text.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();
}

async function scoreReadme(
  readme: string,
  geminiKey: string
): Promise<{ score: number; summary: string } | null> {
  const prompt = `Score this README 0–100 on: clarity (30pts), problem framing (30pts), technical depth (20pts), completeness (20pts).

README: ${readme.slice(0, 3000)}

Return JSON only: { "score": <number>, "summary": "<one sentence>" }`;

  const text = await callGemini(prompt, geminiKey);
  if (!text) return null;

  try {
    const parsed = JSON.parse(stripCodeFence(text));
    if (typeof parsed.score === "number" && typeof parsed.summary === "string") {
      return {
        score: Math.min(100, Math.max(0, Math.round(parsed.score))),
        summary: parsed.summary,
      };
    }
    return null;
  } catch {
    return null;
  }
}

async function classifyFocusAreas(
  repoLines: string,
  allLibs: string[],
  geminiKey: string
): Promise<string[]> {
  const prompt = `Given these GitHub repos and detected AI libraries, return a JSON array of focus areas chosen only from this list: ${JSON.stringify(FOCUS_AREAS)}

Repos:
${repoLines}

Detected libs: ${allLibs.join(", ") || "none"}

Return only a valid JSON array with no explanation.`;

  const text = await callGemini(prompt, geminiKey);
  if (!text) return [];

  try {
    const parsed = JSON.parse(stripCodeFence(text));
    if (!Array.isArray(parsed)) return [];
    const valid = FOCUS_AREAS as readonly string[];
    return parsed.filter(
      (v): v is string => typeof v === "string" && valid.includes(v)
    );
  } catch {
    return [];
  }
}

// ── Per-repo enrichment ───────────────────────────────────────────────────

/** Shared budget for README Gemini calls (decrement synchronously before await). */
type ReadmeGeminiBudget = { left: number };

async function enrichRepo(
  repo: GitHubRepo,
  githubHandle: string,
  ghHeaders: Record<string, string>,
  geminiKey: string,
  readmeBudget: ReadmeGeminiBudget
): Promise<RepoEnrichment> {
  const rawBase = `https://raw.githubusercontent.com/${encodeURIComponent(githubHandle)}/${encodeURIComponent(repo.name)}/HEAD`;

  // Fetch dep files concurrently
  const [requirementsTxt, pyprojectToml, packageJson] = await Promise.all([
    safeFetch(`${rawBase}/requirements.txt`, ghHeaders),
    safeFetch(`${rawBase}/pyproject.toml`, ghHeaders),
    safeFetch(`${rawBase}/package.json`, ghHeaders),
  ]);

  const allDepContent = [requirementsTxt, pyprojectToml, packageJson]
    .filter(Boolean)
    .join("\n");

  const detectedLibs = detectLibs(allDepContent);

  // Skip README scoring for repos with no description and no AI libs — low signal
  let readmeScore: number | null = null;
  let readmeSummary: string | null = null;

  if (repo.description || detectedLibs.length > 0) {
    const readme =
      (await safeFetch(`${rawBase}/README.md`, ghHeaders)) ??
      (await safeFetch(`${rawBase}/readme.md`, ghHeaders));

    if (readme) {
      let allowed = false;
      if (readmeBudget.left > 0) {
        readmeBudget.left -= 1;
        allowed = true;
      }
      if (allowed) {
        const scored = await scoreReadme(readme, geminiKey);
        if (scored) {
          readmeScore = scored.score;
          readmeSummary = scored.summary;
        }
      }
    }
  }

  return { repo, detectedLibs, readmeScore, readmeSummary };
}

// ── Main enrichment job ───────────────────────────────────────────────────

async function runEnrichment(builderId: string): Promise<void> {
  const admin = createAdminClient();
  const githubPat = Deno.env.get("GITHUB_PAT");
  const geminiKey = Deno.env.get("GEMINI_API_KEY");

  if (!geminiKey) {
    console.error("[enrich-github] GEMINI_API_KEY not set");
    return;
  }

  // Load builder — need github_handle to call GitHub API
  const { data: builder, error: builderErr } = await admin
    .from("builders")
    .select("id, github_handle")
    .eq("id", builderId)
    .maybeSingle();

  if (builderErr || !builder) {
    console.error("[enrich-github] builder not found:", builderErr?.message);
    return;
  }
  if (!builder.github_handle) {
    console.error("[enrich-github] builder has no github_handle");
    return;
  }

  const ghHeaders: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "aisea-enrichment/1.0",
    ...(githubPat ? { Authorization: `Bearer ${githubPat}` } : {}),
  };

  // Fetch up to 20 recently-pushed public repos
  const reposRes = await fetch(
    `https://api.github.com/users/${encodeURIComponent(builder.github_handle)}/repos?per_page=20&sort=pushed&type=public`,
    { headers: ghHeaders }
  );

  if (!reposRes.ok) {
    console.error("[enrich-github] GitHub API error:", reposRes.status);
    return;
  }

  const repos: GitHubRepo[] = await reposRes.json();

  if (!Array.isArray(repos) || repos.length === 0) {
    await admin.from("builders").update({
      github_enriched_at: new Date().toISOString(),
      github_activity_status: "dormant",
      github_primary_languages: [],
      github_ai_libs: [],
      github_focus_areas: [],
    }).eq("id", builderId);
    return;
  }

  // Prefer higher-signal repos for the limited README/Gemini budget (stars proxy).
  const sortedByStars = [...repos].sort(
    (a, b) => (b.stargazers_count ?? 0) - (a.stargazers_count ?? 0)
  );

  // Process repos in bounded parallel batches; cap README Gemini calls globally.
  const readmeBudget: ReadmeGeminiBudget = { left: MAX_README_GEMINI_CALLS };
  const results = await mapInBatches(sortedByStars, REPO_ENRICH_CONCURRENCY, (repo) =>
    enrichRepo(repo, builder.github_handle!, ghHeaders, geminiKey, readmeBudget).catch(
      (err) => {
        console.error(`[enrich-github] failed repo ${repo.name}:`, err);
        return {
          repo,
          detectedLibs: [] as string[],
          readmeScore: null,
          readmeSummary: null,
        } satisfies RepoEnrichment;
      }
    )
  );

  // ── Aggregate builder-level signals ──────────────────────────────────

  const allLibs = [...new Set(results.flatMap((r) => r.detectedLibs))];

  // Top 3 languages by repo count
  const langCount: Record<string, number> = {};
  for (const { repo } of results) {
    if (repo.language) {
      langCount[repo.language] = (langCount[repo.language] ?? 0) + 1;
    }
  }
  const primaryLanguages = Object.entries(langCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([lang]) => lang);

  // Most recent push across all repos
  const mostRecentPush = repos.reduce(
    (latest, r) => (r.pushed_at > latest ? r.pushed_at : latest),
    repos[0].pushed_at
  );

  // Highest README score (internal — residency ranking)
  const maxReadmeScore = results.reduce<number | null>((max, r) => {
    if (r.readmeScore === null) return max;
    return max === null ? r.readmeScore : Math.max(max, r.readmeScore);
  }, null);

  // Single Gemini call for focus area classification
  const repoLines = results
    .map((r) => `${r.repo.name}: ${r.repo.description ?? "no description"}`)
    .join("\n");
  const focusAreas = await classifyFocusAreas(repoLines, allLibs, geminiKey);

  // ── Upsert project rows ───────────────────────────────────────────────
  // Strategy: update only enrichment columns on existing rows to preserve
  // manually-set fields (stage, tech_stack, focus_areas, tagline, etc.).
  // Insert with safe defaults for new GitHub-sourced rows.

  const urls = results
    .map((r) => r.repo.html_url)
    .filter((u): u is string => Boolean(u));

  const { data: existingRows } = urls.length
    ? await admin
        .from("projects")
        .select("id, github_url")
        .eq("builder_id", builderId)
        .in("github_url", urls)
    : { data: [] as { id: string; github_url: string }[] };

  const urlToId = new Map(
    (existingRows ?? []).map((row) => [row.github_url as string, row.id as string])
  );

  const inserts: Record<string, unknown>[] = [];
  const updates: { id: string; fields: Record<string, unknown> }[] = [];

  for (const { repo, detectedLibs, readmeSummary } of results) {
    if (!repo.html_url) continue;

    const enrichmentFields = {
      name: repo.name,
      description: repo.description?.slice(0, 280) ?? null,
      github_stars: repo.stargazers_count,
      github_last_commit: repo.pushed_at.slice(0, 10),
      detected_ai_libs: detectedLibs,
      readme_summary: readmeSummary,
    };

    const existingId = urlToId.get(repo.html_url);
    if (existingId) {
      updates.push({ id: existingId, fields: enrichmentFields });
    } else {
      inserts.push({
        builder_id: builderId,
        github_url: repo.html_url,
        stage: "in_progress",
        tech_stack: [],
        focus_areas: [],
        is_public: true,
        ...enrichmentFields,
      });
    }
  }

  if (inserts.length > 0) {
    const { error: insertErr } = await admin.from("projects").insert(inserts);
    if (insertErr) {
      console.error("[enrich-github] bulk project insert failed:", insertErr.message);
    }
  }

  for (let i = 0; i < updates.length; i += PROJECT_UPDATE_CONCURRENCY) {
    const chunk = updates.slice(i, i + PROJECT_UPDATE_CONCURRENCY);
    await Promise.all(
      chunk.map(({ id, fields }) =>
        admin.from("projects").update(fields).eq("id", id)
      )
    );
  }

  // ── Update builder row ────────────────────────────────────────────────
  await admin
    .from("builders")
    .update({
      github_enriched_at: new Date().toISOString(),
      github_activity_status: activityStatus(mostRecentPush),
      github_last_active: mostRecentPush.slice(0, 10),
      github_primary_languages: primaryLanguages,
      github_ai_libs: allLibs,
      github_focus_areas: focusAreas,
      ...(maxReadmeScore !== null ? { github_readme_score: maxReadmeScore } : {}),
    })
    .eq("id", builderId);

  console.log(
    `[enrich-github] completed builder=${builderId} repos=${repos.length} libs=${allLibs.length} focusAreas=${focusAreas.join(",")}`
  );
}

// ── Request body schema ───────────────────────────────────────────────────

const bodySchema = z.object({
  builder_id: z.string().uuid(),
});

// ── Entry point ───────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, corsHeaders);
  }

  // Authenticate caller
  let userId: string;
  try {
    userId = await getUserIdFromRequest(req);
  } catch (e) {
    return jsonResponse(
      { error: e instanceof Error ? e.message : "Unauthorized" },
      401,
      corsHeaders
    );
  }

  // Validate body
  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await req.json());
  } catch (e) {
    const maybeZod = e as { issues?: unknown } | undefined;
    if (maybeZod?.issues) {
      return jsonResponse(
        { error: "Invalid request", issues: maybeZod.issues },
        400,
        corsHeaders
      );
    }
    return jsonResponse({ error: "Invalid request body" }, 400, corsHeaders);
  }

  // Verify the calling user owns this builder_id
  const admin = createAdminClient();
  const { data: link } = await admin
    .from("builder_auth")
    .select("builder_id")
    .eq("user_id", userId)
    .eq("builder_id", parsed.builder_id)
    .maybeSingle();

  if (!link) {
    return jsonResponse(
      { error: "Forbidden — builder not owned by this user" },
      403,
      corsHeaders
    );
  }

  // Return { ok: true } immediately; enrichment runs after response is sent
  const response = jsonResponse(
    { ok: true, builder_id: parsed.builder_id },
    200,
    corsHeaders
  );

  // EdgeRuntime.waitUntil keeps the isolate alive until the promise settles
  // even after the HTTP response has been flushed.
  (
    globalThis as unknown as {
      EdgeRuntime?: { waitUntil(p: Promise<unknown>): void };
    }
  ).EdgeRuntime?.waitUntil(
    runEnrichment(parsed.builder_id).catch((err) => {
      console.error("[enrich-github] fatal error:", err?.message ?? err);
    })
  );

  return response;
});
