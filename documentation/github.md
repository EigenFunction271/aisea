# GitHub Profile Enrichment — PRD

**Product:** AI.SEA Builder Platform
**Feature:** GitHub Enrichment (Manual)
**Status:** Draft
**Version:** 1.0

---

## 1. Overview

Builders on the AI.SEA platform connect their GitHub account during profile setup. This feature allows builders to manually trigger an enrichment job that analyses their public GitHub repositories and automatically populates structured tags on their profile — covering language stack, AI libraries used, project focus areas, and communication quality.

Enrichment is powered by Google Gemini Flash 2.5, which processes repository metadata, dependency files, and README content to produce structured outputs at low cost. The job runs on-demand only — never automatically in the background.

---

## 2. Problem Statement

Builder profiles today are largely self-reported. Skills and tech stack fields are filled in manually, leading to inconsistency, incompleteness, and no signal on recency or actual usage. This degrades two downstream use cases:

- Corporate partners and residency evaluators (e.g. Carousell) cannot efficiently shortlist candidates without manually reviewing each profile
- Challenge matching on the platform cannot be automated without reliable, structured builder capability data

**Goal:** Generate a structured, verified capability fingerprint for each builder from their real GitHub output — without requiring ongoing manual curation from the builder themselves.

---

## 3. Scope

### 3.1 In Scope

- Manual trigger button on the builder's own profile dashboard
- GitHub API fetch of up to 20 most recently pushed public repositories
- Dependency parsing: `requirements.txt`, `pyproject.toml`, `package.json`
- README scoring and summarisation via Gemini Flash 2.5
- Focus area classification via Gemini Flash 2.5
- Aggregated tag writes to `builders` table and per-project writes to `projects` table
- Enrichment status indicator (idle / running / last enriched timestamp)

### 3.2 Out of Scope

- Automatic background enrichment or scheduled re-enrichment
- Private repository access
- GitHub OAuth re-auth flow (assumes handle already stored)
- Commit history or diff analysis
- Contribution graph or social graph signals

---

## 4. User Stories

| # | As a... | I want to... | So that... |
|---|---------|-------------|------------|
| 1 | Builder | click a button to enrich my profile from GitHub | my profile reflects my actual skills without manual tagging |
| 2 | Builder | see when my profile was last enriched | I know whether the data is current |
| 3 | Corporate evaluator | see structured AI lib and focus area tags on a builder's profile | I can shortlist candidates without reading every GitHub repo |
| 4 | Platform admin | re-run enrichment on a specific builder | I can fix stale data without waiting for the builder to act |

---

## 5. Functional Requirements

### 5.1 Trigger — Enrich Button

- Displayed on the builder's own profile dashboard, visible only to the authenticated builder
- Label: **"Enrich from GitHub"**. Below it: last enriched timestamp or "Never enriched" if first run
- Button is disabled and shows a spinner while a job is in progress
- One concurrent job per builder — duplicate triggers are rejected
- On success: timestamp updates, tags populate, success toast shown
- On failure: error toast shown, previous data preserved, retry allowed immediately

### 5.2 GitHub Data Fetch

- Fetch up to 20 most recently pushed public repos via `GET /users/{handle}/repos?per_page=20&sort=pushed`
- For each repo, attempt to fetch `requirements.txt`, `pyproject.toml`, `package.json` from root
- Fetch README content (raw) capped at 3,000 characters for LLM input
- Skip repos with no description and no detected deps (low signal, saves LLM calls)
- Record per-repo: name, description, github_url, language, stars, last pushed date

### 5.3 Dependency Parsing

Match against a hardcoded AI lib list. Exact substring match only — no fuzzy matching.

| Ecosystem | Libraries to detect |
|-----------|-------------------|
| Python | `openai`, `anthropic`, `langchain`, `llama-index`, `transformers`, `pydantic`, `instructor`, `litellm`, `chromadb`, `faiss-cpu`, `sentence-transformers`, `diffusers`, `accelerate`, `google-generativeai` |
| Node / TypeScript | `openai`, `@anthropic-ai/sdk`, `langchain`, `llamaindex`, `ai`, `@vercel/ai`, `chromadb`, `hnswlib-node`, `@google/generative-ai` |

### 5.4 LLM Processing — Gemini Flash 2.5

#### 5.4.1 Focus Area Classification

One call per builder, after all repos are processed. Input: repo names + descriptions + aggregated detected libs.

```
Given these repos and detected AI libraries, return a JSON array of focus areas from
this list only: ["agents", "RAG", "fine-tuning", "vision", "voice", "LLM-infra",
"data-pipelines", "evals", "tools-integrations"]

Repos: {REPOS}
Detected libs: {LIBS}

Return only a JSON array, no explanation.
```

#### 5.4.2 README Scoring

One call per repo that has a README and a description. Returns score (0–100) and a one-sentence project summary.

```
Score this README 0–100 on: clarity (30pts), problem framing (30pts),
technical depth (20pts), completeness (20pts).

README: {README}

Return JSON only: { "score": <number>, "summary": "<one sentence>" }
```

`github_readme_score` on the `builders` table stores the **highest** score across all their repos, not an average. Best-work signal is more useful than average quality.

### 5.5 Data Writes

All writes are upserts. Existing project rows matched on `(builder_id, github_url)` unique constraint.

| Column | Table | Notes |
|--------|-------|-------|
| `github_enriched_at` | builders | null until first run |
| `github_activity_status` | builders | `active` / `occasional` / `dormant` |
| `github_primary_languages` | builders | Top 3 languages by repo count |
| `github_ai_libs` | builders | Aggregated across all repos |
| `github_focus_areas` | builders | LLM classified |
| `github_readme_score` | builders | Highest score across repos — internal only |
| `github_last_active` | builders | Most recent repo push date |
| `github_stars` | projects | Per-repo |
| `github_last_commit` | projects | Per-repo |
| `detected_ai_libs` | projects | Per-repo lib detection |
| `readme_summary` | projects | LLM-generated 1-sentence summary |

Activity status thresholds:

- **active** — last push within 30 days
- **occasional** — last push 31–90 days ago
- **dormant** — last push > 90 days ago

---

## 6. Non-Functional Requirements

| Concern | Requirement |
|---------|-------------|
| Latency | Job completes within 60 seconds for a builder with 20 repos. Surface progress to user. |
| Cost | Gemini Flash 2.5 only. Max ~25 LLM calls per run (1 focus classification + up to 20 README scores + 4 buffer). |
| Rate limits | GitHub authenticated: 5,000 req/hr. At 20 repos × ~4 file fetches = 80 req per builder — well within limits. |
| Idempotency | Re-running enrichment overwrites previous data cleanly. No orphaned rows. |
| Error handling | Partial failures (e.g. one repo fetch fails) must not abort the entire job. Log failures, continue. |
| Security | Enrichment endpoint must validate that the calling user owns the `builder_id`. Service role key never exposed to client. |

---

## 7. Technical Architecture

### 7.1 Stack

- **Frontend:** Next.js on Vercel — button UI, status polling
- **Enrichment job:** Supabase Edge Function (Deno) — `enrich-github`
- **Database:** Supabase (Postgres) — `builders` and `projects` tables
- **LLM:** Google Gemini Flash 2.5 via REST API
- **GitHub data:** GitHub REST API v3 with personal access token

### 7.2 Request Flow

```
1. Builder clicks "Enrich from GitHub" in Next.js dashboard

2. Vercel API route POST /api/builders/enrich
   → validates session
   → fires-and-forgets to Supabase Edge Function with { builder_id }

3. Edge function validates builder_id ownership
   → sets job-in-progress state

4. Edge function fetches repos from GitHub API

5. For each repo:
   → fetch deps files
   → optionally fetch README (if description exists)
   → run Gemini README score call

6. Aggregate results
   → run single Gemini focus area classification call

7. Upsert projects rows
   → update builders row
   → set github_enriched_at = now()

8. Frontend polls GET /api/builders/enrich-status every 3s
   → updates UI on completion
```

### 7.3 Edge Function Signature

```
POST /functions/v1/enrich-github

Body:    { builder_id: string }
Auth:    Supabase service role key (set by Vercel API route, never client-side)
Response: { ok: true }  — job runs async after response is returned
```

### 7.4 Gemini API Call Pattern

```typescript
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 256, temperature: 0.1 }
    })
  }
);
const data = await response.json();
const text = data.candidates[0].content.parts[0].text;
```

---

## 8. UI Specification

### 8.1 Enrichment Card States

| State | UI Behaviour |
|-------|-------------|
| Never enriched | Button enabled. Below: "GitHub profile not yet enriched." |
| Idle (enriched before) | Button enabled. Below: "Last enriched: [relative time, e.g. 3 days ago]" |
| Running | Button disabled, spinner. Below: "Enriching your profile..." |
| Success | Button re-enables. Toast: "Profile enriched successfully". Timestamp updates. |
| Error | Button re-enables. Toast: "Enrichment failed — try again". Previous data preserved. |

### 8.2 Profile Card Tag Display

- `github_primary_languages` — coloured language pills (reuse existing tag component)
- `github_ai_libs` — collapsible tag list, collapsed to 5 with "+ N more" if longer
- `github_focus_areas` — outlined badge chips
- `github_activity_status` — coloured dot: green (active), amber (occasional), grey (dormant)
- `github_readme_score` — **not shown to builders**. Internal use only for residency candidate ranking.

---

## 9. Schema Changes

Full migration SQL below. Also requires a unique constraint on `projects` to support upserts:

```sql
ALTER TABLE public.projects
  ADD CONSTRAINT projects_builder_github_url_key UNIQUE (builder_id, github_url);

ALTER TABLE public.builders
  ADD COLUMN github_enriched_at timestamptz,
  ADD COLUMN github_activity_status text CHECK (
    github_activity_status IN ('active', 'occasional', 'dormant')
  ),
  ADD COLUMN github_primary_languages text[] NOT NULL DEFAULT '{}',
  ADD COLUMN github_ai_libs          text[] NOT NULL DEFAULT '{}',
  ADD COLUMN github_focus_areas      text[] NOT NULL DEFAULT '{}',
  ADD COLUMN github_readme_score     integer CHECK (github_readme_score BETWEEN 0 AND 100);

ALTER TABLE public.projects
  ADD COLUMN github_stars       integer,
  ADD COLUMN github_last_commit date,
  ADD COLUMN detected_ai_libs   text[] NOT NULL DEFAULT '{}',
  ADD COLUMN readme_summary     text;

-- Indexes
CREATE INDEX builders_github_languages_gin  ON public.builders USING gin (github_primary_languages);
CREATE INDEX builders_github_ai_libs_gin    ON public.builders USING gin (github_ai_libs);
CREATE INDEX builders_github_focus_areas_gin ON public.builders USING gin (github_focus_areas);
CREATE INDEX builders_activity_status_idx   ON public.builders (github_activity_status);
```

---

## 10. Success Metrics

| Metric | Target (30 days post-launch) | Notes |
|--------|------------------------------|-------|
| % of GitHub-connected builders who enrich | > 60% | Measures organic uptake |
| Avg enrichment job completion time | < 45s (P95) | |
| Enrichment job error rate | < 5% | GitHub API failures + LLM errors combined |
| Residency shortlist time saved | 50% reduction | Qualitative — Carousell eval as baseline |
| Focus area classification accuracy | > 80% | Spot-check 50 profiles manually post-launch |

---

## 11. Open Questions

- **Rate limiting:** Cap enrichments per builder per day (e.g. max 3/day) to prevent runaway Gemini costs? Probably fine at current scale but worth deciding upfront.
- **Admin trigger:** Should platform admins be able to force-enrich a specific builder from an internal dashboard? Useful for residency prep.
- **Gemini key management:** Personal key per environment, or routed through a shared secrets manager?
- **Project deduplication:** If a builder renames a repo, the old `github_url` row becomes orphaned. Define a cleanup policy.
- **Opt-out:** Should builders be able to hide enriched tags from public profiles while still having them used internally for challenge matching?

---

## 12. Future Considerations

- Scheduled re-enrichment (weekly) as an opt-in setting once the feature has proven value
- Commit history analysis — detect consistency of contribution patterns over time
- Cross-builder benchmarking — percentile ranking of `readme_score` and activity within city or focus area
- Challenge auto-matching — surface relevant builders to challenge sponsors based on `github_ai_libs` and `github_focus_areas`
- Webhook-triggered enrichment on new GitHub push events via GitHub Apps integration

---

*AI.SEA Platform — Internal Engineering Document — Not for external distribution*