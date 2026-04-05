# AI.SEA Platform

Southeast Asia's largest grassroots AI builder community — 10,000+ builders across KL, Jakarta, Manila, HCMC, Bangkok, and beyond.

---

## What this is

This repo is the full-stack web platform for AI.SEA, including:

- **Public site** — homepage, events, residency, work-with-us, cities, case studies
- **Builder directory** — profiles, skills, project portfolios
- **Challenge platform** — live challenges, submissions, leaderboards
- **Wiki** — community knowledge base with draft/review workflow
- **GitHub enrichment** — on-demand analysis of builders' GitHub repos via Gemini Flash 2.5

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js (App Router, server components) |
| Styling | Tailwind CSS v4 |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth |
| Edge Functions | Supabase Edge Functions (Deno) |
| Storage | Supabase Storage |
| LLM | Google Gemini Flash 2.5 |
| i18n | next-intl (en, id, zh, vi) |
| 3D / shaders | React Three Fiber + custom GLSL |
| Animation | GSAP |
| CI | GitHub Actions |

---

## Prerequisites

- Node.js ≥ 20
- pnpm (or npm)
- [Supabase CLI](https://supabase.com/docs/guides/cli) — for local dev and deploying Edge Functions
- A Supabase project — free tier is sufficient for local dev

---

## Local setup

### 1. Clone and install

```bash
git clone https://github.com/EigenFunction271/aisea.git
cd aisea-www
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in the values. See the section below for where to get each key.

### 3. Run database migrations

Connect the Supabase CLI to your project and push all migrations:

```bash
supabase login
supabase link --project-ref your-project-ref
supabase db push
```

Migrations live in `supabase/migrations/` and run in timestamp order.

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Run tests

```bash
npm test
```

Runs the i18n path utility tests via Node's built-in test runner.

---

## Environment variables

Full field-by-field notes are in [`.env.example`](./.env.example). Summary:

### Next.js app (`.env.local` and your host, e.g. Vercel)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL — `https://<ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ✅ | Supabase anon key (safe for browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service role key — **server only** (API routes, RSC); never `NEXT_PUBLIC_*` |
| `NEXT_PUBLIC_BASE_URL` | ✅ | Absolute site URL, no trailing slash — sitemap and canonicals |
| `GITHUB_PAT` | Strongly recommended | Same token as below: needed for **contribution heatmap** (`user(login)` GraphQL) when the viewer is not on a GitHub-linked session. Not read by Edge Functions from here. |

`GEMINI_API_KEY` is **not** required in `.env.local` unless you call Gemini from Next.js; enrichment uses the secret below.

### Supabase Edge Function secrets (CLI only)

These are **not** loaded from `.env.local`. Set them with `supabase secrets set` (see [Setup: GitHub PAT and Supabase secrets](#setup-github-pat-and-supabase-secrets)).

Supabase **injects** `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` into every function — do not set those manually.

| Secret | Required | Description |
|--------|----------|-------------|
| `ALLOWED_ORIGIN` | ✅ | Comma-separated CORS allowlist for browser calls to your functions |
| `GITHUB_PAT` | Strongly recommended | Repo + API access for **`enrich-github`** (5,000 req/hr authenticated vs ~60/hr anonymous) |
| `GEMINI_API_KEY` | ✅ for enrichment | Powers README scoring and focus-area classification in **`enrich-github`** |

---

## Setup: GitHub PAT and Supabase secrets

Use this checklist so **Next.js** and **Edge Functions** both have what they need.

### Why GitHub PAT appears twice

| Where | Variable | Consumers |
|-------|----------|-----------|
| **`.env.local` + production host env** | `GITHUB_PAT` | Next.js server — builder profile **contribution calendar** (GitHub GraphQL) for the PAT-backed path |
| **Supabase secrets** | `GITHUB_PAT` | **`enrich-github`** — list repos, fetch `raw.githubusercontent.com` dependency/README files |

You can use the **same classic PAT** in both places. Edge Functions never read your laptop’s `.env.local`; Vercel never reads Supabase secrets.

### Step 1 — Create the GitHub token

1. Open **[GitHub → Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)**.
2. **Classic token** (simplest for this app):
   - **Generate new token (classic)**.
   - Scopes: enable **`read:user`** (GraphQL contribution calendar + user API) and **`public_repo`** (public repository contents for enrichment).
   - Generate and copy the token once (GitHub will not show it again).

**Fine-grained alternative:** Create a token with read access to **account** profile/metadata where required, and **Contents: Read-only** on **public** repositories you expect to enrich — mirror the same capabilities as above for your org’s policy.

Without any PAT, GitHub allows only **~60 unauthenticated API requests/hour**, which breaks down quickly for enrichment (many repos × several file fetches per repo).

### Step 2 — Add secrets for Edge Functions (Supabase CLI)

1. Install and log in: `supabase login`.
2. Link your project (once per machine/repo):  
   `supabase link --project-ref <your-project-ref>`  
   (`project-ref` is the subdomain of `https://<project-ref>.supabase.co`.)
3. Set **all** function secrets in one command (no spaces after commas in `ALLOWED_ORIGIN`):

```bash
supabase secrets set \
  ALLOWED_ORIGIN=https://aisea.builders,http://localhost:3000 \
  GITHUB_PAT=ghp_your_github_token_here \
  GEMINI_API_KEY=AIza_your_gemini_key_here
```

- **`ALLOWED_ORIGIN`** — Every browser origin that may call your functions (production site, local dev). Must match `Origin`/`Referer` handling in `supabase/functions/_shared/cors.ts`. Include both prod and `http://localhost:3000` during development.
- **`GITHUB_PAT`** — Same value as in Step 1.
- **`GEMINI_API_KEY`** — From [Google AI Studio](https://aistudio.google.com/app/apikey) (or Google Cloud Credentials). Used only inside **`enrich-github`** today.

4. Confirm names are present (values are hidden):

```bash
supabase secrets list
```

5. **Redeploy** functions after changing secrets so new values are picked up:

```bash
supabase functions deploy enrich-github
# or: supabase functions deploy
```

### Step 3 — Configure Next.js (local)

In the project root:

```bash
cp .env.example .env.local
```

Set at least:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_BASE_URL`
- **`GITHUB_PAT=`** — same token as in Supabase secrets (for the contribution heatmap on builder profiles).

### Step 4 — Production host (e.g. Vercel)

In the project **Environment Variables** UI, add the same **Next.js** variables as in `.env.local`, including **`GITHUB_PAT`** and **`SUPABASE_SERVICE_ROLE_KEY`**. Do **not** put the service role or PAT in any `NEXT_PUBLIC_*` key.

Edge Function secrets remain **only** in Supabase (`supabase secrets set`); you do not paste `GEMINI_API_KEY` into Vercel unless a future Next.js feature needs it.

---

## Where to get API keys (reference)

### Supabase keys (for `.env.local` / Vercel)

1. [supabase.com](https://supabase.com) → your project → **Project Settings** → **API**
2. Copy **Project URL**, **anon public**, and **service_role** into the variables in the table above.

> ⚠️ The **service_role** key bypasses RLS. Never expose it to the browser.

### GitHub OAuth (optional — social login)

Enables **Continue with GitHub** and **Link GitHub account** so the app can use GitHub’s **`viewer`** GraphQL contribution data for logged-in users.

1. Supabase Dashboard → **Authentication** → **Providers** → **GitHub** → enable  
2. [GitHub OAuth App](https://github.com/settings/developers): **Authorization callback URL** = value shown in Supabase (typically `https://<project-ref>.supabase.co/auth/v1/callback`).

### Google Gemini (for Supabase secret `GEMINI_API_KEY`)

1. [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) (or Google Cloud → **APIs & Services** → **Credentials**) → create API key  
2. `supabase secrets set GEMINI_API_KEY=...` (see [Setup](#setup-github-pat-and-supabase-secrets))

Pricing: [ai.google.dev/pricing](https://ai.google.dev/pricing).

---

## Deploying Edge Functions

Set [Supabase secrets](#setup-github-pat-and-supabase-secrets) (`ALLOWED_ORIGIN`, `GITHUB_PAT`, `GEMINI_API_KEY`) before or after deploy; **redeploy** after changing secrets.

```bash
# Deploy a single function
supabase functions deploy enrich-github

# Deploy all functions
supabase functions deploy
```

Edge Functions are in `supabase/functions/`. Shared utilities (auth, CORS) are in `supabase/functions/_shared/`.

---

## Project structure

```
src/
  app/
    [locale]/          # All public and dashboard pages (i18n via next-intl)
      dashboard/       # Authenticated dashboard (builders, wiki, challenges)
      case-studies/    # Partner case study pages
      cities/          # City hub pages
      work-with-us/    # Partnership page
      residency/       # Builder residency page
    api/               # Next.js API routes (server-side)
      builders/        # enrich, enrich-status
      wiki/            # attachments, upsert-page
  lib/
    supabase/          # client, server, admin Supabase clients
    builders/          # Edge Function call wrappers
    challenges/        # Challenge Edge Function helpers
    i18n/              # Locale path utilities
    seo/               # Seeded data (cities, case studies)
  messages/            # i18n translation files (en, id, zh, vi)
  components/          # Shared UI components

supabase/
  migrations/          # Postgres migrations (run in order via supabase db push)
  functions/           # Deno Edge Functions
    _shared/           # auth.ts, cors.ts helpers
    enrich-github/     # GitHub enrichment job
    manage-challenge/  # Challenge CRUD
    create-builder-profile/
    enroll-challenge/
    review-challenge-submission/
    upsert-challenge-submission/

documentation/         # PRDs, schema reference, audit docs
```

---

## CI

GitHub Actions runs on every push and PR:

- `npx tsc --noEmit` — TypeScript check
- `npm test` — i18n path utility tests

See `.github/workflows/ci.yml`.

---

## Internationalization

The site supports English (default), Indonesian (`id`), Chinese (`zh`), and Vietnamese (`vi`). Translations live in `src/messages/`. The locale is part of the URL path: `/en/...`, `/id/...`, etc.

Routing is handled by `next-intl`. See `src/i18n/routing.ts` for locale config.

---

## Database

All schema changes are tracked as migrations in `supabase/migrations/`. Never modify the database directly in production — write a migration instead.

Key tables: `builders`, `builder_auth`, `projects`, `skills`, `tech_stack_options`, `challenges`, `challenge_submissions`, `wiki_pages`, `wiki_attachments`.

Full schema reference: [`documentation/SCHEMA.md`](./documentation/SCHEMA.md)
