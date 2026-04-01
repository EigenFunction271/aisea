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

Full documentation is in [`.env.example`](./.env.example). Summary:

### Next.js app (`.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL — `https://<ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ✅ | Supabase anon key (safe for browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key — server only, never expose to client |
| `NEXT_PUBLIC_BASE_URL` | ✅ | Absolute site URL, no trailing slash — used for sitemap and canonical links |
| `GITHUB_PAT` | Recommended | Put in **`.env.local`** for the Next.js server (contribution heatmap via GitHub GraphQL). Also set as a **Supabase secret** for `enrich-github`. Classic PAT: `read:user` + `public_repo` covers both. |
| `GEMINI_API_KEY` | — | Listed here for docs; set as a Supabase secret (see below) |

### Supabase Edge Function secrets

Edge Functions run on Supabase's Deno runtime and read secrets set via the CLI — **not** `.env.local`. `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are auto-injected by Supabase.

Set additional secrets once with:

```bash
supabase secrets set \
  ALLOWED_ORIGIN=https://aisea.builders,http://localhost:3000 \
  GITHUB_PAT=github_pat_... \
  GEMINI_API_KEY=AIza...
```

Verify:

```bash
supabase secrets list
```

| Secret | Required | Description |
|--------|----------|-------------|
| `ALLOWED_ORIGIN` | ✅ | Comma-separated CORS origins — e.g. `https://aisea.builders,http://localhost:3000` |
| `GITHUB_PAT` | Recommended | GitHub PAT for enrichment (60 req/hr without; 5,000/hr with) |
| `GEMINI_API_KEY` | ✅ for enrichment | Google Gemini API key |

---

## Where to get API keys

### Supabase keys

1. Go to [supabase.com](https://supabase.com) → create a project (free tier is fine)
2. Dashboard → your project → **Project Settings** → **API**
3. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public** key → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

> ⚠️ The `service_role` key bypasses Row Level Security. Never put it in a `NEXT_PUBLIC_*` variable or expose it to the browser.

### GitHub OAuth (Supabase Auth)

Enables **Continue with GitHub** on the login page and **Link GitHub account** on Edit profile. When a user’s session includes a GitHub OAuth token, their profile heatmap is loaded with GitHub’s GraphQL `viewer` query so totals match github.com (including private contributions if the user shows them on their GitHub profile).

1. Supabase Dashboard → **Authentication** → **Providers** → **GitHub** → enable
2. Create a [GitHub OAuth App](https://github.com/settings/developers): set **Authorization callback URL** to the value shown in Supabase (usually `https://<project-ref>.supabase.co/auth/v1/callback`)

### GitHub Personal Access Token

Used by:

- The **`enrich-github`** Edge Function (public repo listing and file fetches)
- The **Next.js server** (builder profile contribution calendar via GitHub GraphQL `user(login:…)` when no per-user OAuth data is available yet)

1. Go to [github.com/settings/tokens](https://github.com/settings/tokens)
2. Choose **"Generate new token (classic)"** or **"Fine-grained token"**
   - Classic: tick **`read:user`** and **`public_repo`** (covers GraphQL contributions + repo enrichment)
   - Fine-grained: grant read access to user profile metadata and repo contents as needed for your org
3. Copy the token — GitHub only shows it once
4. Add to **`.env.local`** as `GITHUB_PAT=…` for local Next.js, and set a Supabase secret for Edge Functions: `supabase secrets set GITHUB_PAT=github_pat_...`

Without a token, enrichment and the public heatmap fallback are rate-limited to 60 GitHub API requests per hour — enough for testing, not production.

### Google Gemini API key

Used by the `enrich-github` Edge Function for README scoring and focus area classification. Model: `gemini-2.5-flash` (low cost).

1. Go to [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
   — or Google Cloud Console → **APIs & Services** → **Credentials**
2. Click **"Create API key"** and select (or create) a Google Cloud project
3. Copy the key
4. Set it as a Supabase secret: `supabase secrets set GEMINI_API_KEY=AIza...`

Free tier: Gemini Flash has a generous free quota for development. See [ai.google.dev/pricing](https://ai.google.dev/pricing) for production rates.

---

## Deploying Edge Functions

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
