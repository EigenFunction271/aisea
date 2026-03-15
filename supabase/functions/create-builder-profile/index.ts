import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getUserIdFromRequest, createAdminClient } from "../_shared/auth.ts";
import { corsHeaders } from "../_shared/cors.ts";

declare const Deno: {
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
};

const BUILDERS_TABLE = "builders";
const BUILDER_AUTH_TABLE = "builder_auth";
const SKILLS_TABLE = "skills";

interface CreateBuilderProfilePayload {
  username: string;
  name: string;
  city: string;
  bio?: string;
  skills?: string[];
  github_handle?: string;
  linkedin_url?: string;
  instagram_url?: string;
  twitter_url?: string;
  personal_url?: string;
}

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  let userId: string;
  try {
    userId = await getUserIdFromRequest(req);
  } catch (e) {
    return jsonResponse(
      { error: e instanceof Error ? e.message : "Unauthorized" },
      401
    );
  }

  let body: CreateBuilderProfilePayload;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const { username, name, city, bio, skills = [], github_handle, linkedin_url, instagram_url, twitter_url, personal_url } = body;
  if (!username?.trim() || !name?.trim() || !city?.trim()) {
    return jsonResponse(
      { error: "username, name, and city are required" },
      400
    );
  }

  const slug = username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-");
  if (!slug) {
    return jsonResponse({ error: "Invalid username" }, 400);
  }

  const admin = createAdminClient();

  // Check username unique
  const { data: existing } = await admin
    .from(BUILDERS_TABLE)
    .select("id")
    .eq("username", slug)
    .maybeSingle();
  if (existing) {
    return jsonResponse({ error: "Username already taken" }, 409);
  }

  // Validate skills slugs exist
  if (skills.length > 0) {
    const { data: validSkills } = await admin
      .from(SKILLS_TABLE)
      .select("slug")
      .in("slug", skills);
    const validSet = new Set((validSkills ?? []).map((r) => r.slug));
    const invalid = skills.filter((s) => !validSet.has(s));
    if (invalid.length > 0) {
      return jsonResponse(
        { error: `Invalid skills: ${invalid.join(", ")}` },
        400
      );
    }
  }

  const builderRow = {
    username: slug,
    discord_id: null,
    name: name.trim(),
    city: city.trim(),
    bio: bio?.trim()?.slice(0, 160) ?? null,
    skills: skills,
    github_handle: github_handle?.trim() || null,
    linkedin_url: linkedin_url?.trim() || null,
    instagram_url: instagram_url?.trim() || null,
    twitter_url: twitter_url?.trim() || null,
    personal_url: personal_url?.trim() || null,
  };

  const { data: builder, error: insertError } = await admin
    .from(BUILDERS_TABLE)
    .insert(builderRow)
    .select()
    .single();

  if (insertError) {
    return jsonResponse(
      { error: insertError.message ?? "Failed to create profile" },
      500
    );
  }

  const { error: linkError } = await admin.from(BUILDER_AUTH_TABLE).insert({
    user_id: userId,
    builder_id: builder.id,
  });

  if (linkError) {
    if (linkError.code === "23505") {
      return jsonResponse(
        { error: "You already have a builder profile linked" },
        409
      );
    }
    return jsonResponse(
      { error: linkError.message ?? "Failed to link profile" },
      500
    );
  }

  return jsonResponse({ builder }, 201);
});
