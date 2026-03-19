# Implementation Plan: Builder Directory & Discord Bot

**References:** [PRD.md](./PRD.md) · [SCHEMA.md](./SCHEMA.md)  
**Scope:** M1–M4 (M5 Hackathon Hook out of scope)

---

## Current state (as of March 2026)

| Area | Status |
|------|--------|
| **Phase 0** | Done: schema, RLS, Edge Functions `create-builder-profile` + `claim-builder-profile`, seeded `skills` / `tech_stack_options`, Supabase Auth (email). |
| **Auth UI** | Done: `[locale]/login` (sign up / sign in), auth callback, redirect to dashboard after login; optional `?next=` for return URL. |
| **Dashboard** | Done: `[locale]/dashboard` (protected); shows profile status; CTAs for "Create profile", "Claim profile", and "Challenges". |
| **Challenges (dashboard feature)** | Slices 1-4 done. See [CHALLENGES_IMPLEMENTATION_PLAN.md](./CHALLENGES_IMPLEMENTATION_PLAN.md) and [CHALLENGES_IMPLEMENTATION_GUIDE.md](./CHALLENGES_IMPLEMENTATION_GUIDE.md). Slice 5 (notifications, analytics, hardening) pending. |
| **Phase 2 (directory + web profile)** | Not started: no `/builders` or `/builders/[username]` routes; no web form calling Edge Function for create; claim flow (e.g. Discord DM verification) not implemented. |
| **Phase 1 (Discord bot)** | Separate track; not in this repo. |
| **Phases 3-4** | Blocked on Phase 2 (and Phase 1 for bot project submit). |

**Next focus:** Phase 2 -- directory pages and web profile create/edit. See **Phase 2 (Web) -- Implementation todo** below and [TODO.md](../TODO.md) for actionable tasks.

---

## Prerequisites

- [ ] **Supabase project** — Create project at supabase.com; note project URL and keys from **API Keys** (publishable and secret).
- [ ] **Env vars** — Add to Vercel and local `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. For server/cron/bot/Edge Functions: `SUPABASE_SECRET_KEY`.
- [ ] **Discord application** — Create app in Discord Developer Portal; bot token, application ID; enable privileged intents if needed (e.g. for DM). Invite bot to server with scope `applications.commands`; bot can be invoked from any channel and will DM the user for the flow.
- [ ] **Fixed lists** — Reference tables in Supabase: `skills` and `tech_stack_options` (slug, label, sort_order). Bot and web read from these; `builders.skills` and `projects.tech_stack` store slugs. See [SCHEMA.md](./SCHEMA.md).

---

## Phase 0: Foundation (Supabase + shared config)

**Goal:** Database, RLS, Auth, and fixed lists ready for both web and bot.

| Task | Details |
|------|--------|
| **0.1 Schema** | Create `skills`, `tech_stack_options`, `builders`, `projects`, and `builder_auth` per [SCHEMA.md](./SCHEMA.md). Unique on `builders.username` and `builders.discord_id` (partial unique where not null). |
| **0.2 RLS** | Per SCHEMA: public read on `builders`, `projects`, `skills`, `tech_stack_options`. No client INSERT on `builders` or `builder_auth`; authenticated UPDATE/DELETE on `builders` only for own row (via `builder_auth`). Projects: authenticated INSERT/UPDATE/DELETE only for own builder. Bot and Edge Functions use secret key. |
| **0.3 Supabase Auth** | Enable Email (or Magic Link) and/or OAuth. Web profile creation and claim go through Edge Functions only (0.4). |
| **0.4 Edge Functions** | **create-builder-profile:** accepts profile payload, validates username + skills slugs, inserts `builders` + `builder_auth` with `auth.uid()`. **claim-builder-profile:** accepts handle + verification token, validates, inserts `builder_auth` (verification TBD; see SCHEMA "Claim profile - verification"). |
| **0.5 Fixed lists** | Seed `skills` and `tech_stack_options` with initial slugs/labels; bot and web validate against these. |
| **0.6 Bot repo / service** | If bot is separate repo, add Supabase client and env (service role). If in monorepo, add `apps/discord-bot` or `scripts/bot` and same env. |

**Deliverables:** Migrations for all tables; RLS policies; Edge Functions for create + claim; seeded reference tables; bot env.

---

## Phase 1: M1 — Discord Bot MVP (Profile only)

**Goal:** Bot collects profile (handle, name, city, skills, GitHub, bio, optional URLs) and writes to Supabase; builder gets confirmation with profile link.

| Task | Details |
|------|--------|
| **1.1 Slash commands** | Register `/profile create` and `/profile update`. User can trigger from **any channel** (or DM); bot responds by opening a DM and running the flow there. |
| **1.2 DM flow** | On trigger, open DM; ask for handle (check uniqueness), name, city, skills (fixed list multi-select), GitHub handle, bio (160 chars), optional LinkedIn, optional personal URL. For `/profile update`, allow updating any field. |
| **1.3 Supabase write** | On completion, upsert `builders` row. Use `discord_id` as key for "same Discord user"; set `username` from chosen handle. Post confirmation in DM with link to `https://aisea.builders/builders/[username]` (or staging URL). |
| **1.4 Handle uniqueness** | On handle submit, check `builders.username`; if taken, ask again. Reserve or block certain slugs (e.g. `admin`, `api`) if needed. |

**Deliverables:** Bot deployable (Railway/Fly/VPS); profile create and update working; data visible in Supabase.

---

## Phase 2: M2 — Directory + Web profile (create/edit)

**Goal:** Public `/builders` and `/builders/[username]` live; filters (city, skills, contribution bands, project count); sort by recently active; web profile create/edit with Supabase Auth.

| Task | Details |
|------|--------|
| **2.1 Supabase client in Next.js** | Add `@supabase/supabase-js` and optionally `@supabase/ssr` for App Router. Create server and client helpers; use publishable key for public reads. |
| **2.2 Auth UI** | Sign-up / sign-in (email or OAuth) using Supabase Auth. After login, redirect to "Create profile" or "Edit profile" (if already linked). |
| **2.3 Link auth → builder** | Profile creation on web: client calls Edge Function **create-builder-profile** with payload; function inserts `builders` + `builder_auth`. Claiming existing (Discord-created) profile: client calls **claim-builder-profile** with handle + verification token (see SCHEMA). When user edits: resolve builder via `builder_auth`; allow update only their row (RLS). |
| **2.4 Profile create/edit pages** | Authenticated routes (e.g. `/builders/me/edit` or `/builders/new`). Form: handle, name, city, skills (from `skills` table), GitHub, bio (160), optional URLs. Validate handle uniqueness. Create profile via Edge Function; edits via client (RLS allows update own builder). |
| **2.5 Public directory page** | `app/[locale]/builders/page.tsx` (or `app/builders/page.tsx` if builders section is English-only and outside locale). Fetch builders (and project count per builder). Filters: city, skills, contribution count bands, project count. Sort: recently active (e.g. `github_last_active` desc). Card: name, city, skills, bio, GitHub indicator, project count; link to `/builders/[username]`. |
| **2.6 Public profile page** | `app/builders/[username]/page.tsx`. Fetch by `username`; 404 if not found. Show bio, basic info, skills, GitHub contribution graph (or placeholder until M3), last active, listed projects. English-only copy for v1. |
| **2.7 Routing / locale** | Decide: `/builders` under `[locale]` with English-only content, or top-level `/builders` to keep locale logic simple. PRD says v1 English only; either is fine. |

**Deliverables:** Directory and profile pages live; web users can create and edit profile with Supabase Auth; filters and sort working.

---

## Phase 2 (Web) — Implementation todo

Ordered tasks for the Next.js app (v1 English-only for `/builders`). Tick in [TODO.md](../TODO.md) as you go.

| # | Task | Notes |
|---|------|--------|
| **2.A** | **Routing** | Decide: `/builders` under `[locale]` (e.g. `app/[locale]/builders/`) vs top-level `app/builders/`. PRD v1 English only; either is fine. Document choice. |
| **2.B** | **Public directory page** | `builders/page.tsx`: fetch builders + project count (Supabase; anon read). List cards: name, city, skills, bio, project count; link to `/[username]`. No filters in first slice; add city/skills/contribution/project count filters in a follow-up. |
| **2.C** | **Public profile page** | `builders/[username]/page.tsx`: fetch by `username`, 404 if missing. Show name, city, bio, skills, GitHub handle (link), optional GitHub contribution placeholder; list projects (name, description, stage, links). |
| **2.D** | **API / Edge Function client** | Typed wrapper to call `create-builder-profile` Edge Function (auth JWT). Validate payload (e.g. Zod): username, name, city, skills[], bio (160), github_handle, optional URLs. Handle errors and log request/response on failure. |
| **2.E** | **Web profile create** | Replace dashboard create stub: form at `dashboard/create-profile` (or dedicated route) that collects fields, checks username uniqueness (query or Edge Function), calls Edge Function on submit; on success redirect to dashboard or profile. Load `skills` from Supabase for multi-select. |
| **2.F** | **Web profile edit** | Authenticated page (e.g. `dashboard/edit-profile` or `builders/me/edit`): load current builder via `builder_auth`; form pre-filled; update via Supabase client (RLS allows update own row). Same skills/bio/URL constraints. |
| **2.G** | **Claim profile (optional v1)** | Either: (1) implement Discord DM verification (bot sends code; user enters code; call `claim-builder-profile` with token), or (2) keep “Claim profile” as stub and document as Phase 2.1. SCHEMA recommends Discord DM verification. |
| **2.H** | **Directory filters + sort** | Add filters: city (dropdown from distinct), skills (multi from `skills` table), contribution bands, project count. Sort: `github_last_active` desc (nullable last). |
| **2.I** | **Optional: middleware** | If desired, protect `/[locale]/dashboard` (and nested) in middleware by checking session; else keep current server-side redirect from dashboard page. |

**Clarifications to confirm before coding:**  
- Locale: is `/builders` under `[locale]` or top-level?  
- Claim verification: ship lightweight (e.g. claim by handle only, document risk) or wait for Discord DM verification?

---

## Phase 3: M3 — GitHub integration

**Goal:** Daily cron fetches contribution data for all builders with `github_handle`; updates `github_contributions` and `github_last_active`; profile page can show graph/recency.

| Task | Details |
|------|--------|
| **3.1 Cron endpoint** | Vercel Cron: e.g. `app/api/cron/github-contributions/route.ts` (or `vercel.json` cron targeting this). Secure with `CRON_SECRET` or Vercel’s auth. |
| **3.2 Fetch logic** | Load builders with non-null `github_handle`. For each, call GitHub public API (contribution count last 12 months, last activity). Use service role to update `builders.github_contributions` and `builders.github_last_active`. Respect rate limits; use token if builder count is high (see PRD). |
| **3.3 Profile page** | Display contribution count and last active; optionally embed or link to GitHub contribution graph (or fetch graph data if needed). |

**Deliverables:** Daily sync of GitHub data; profile and directory show "recently active" and contribution bands.

---

## Phase 4: M4 — Project submissions + project listing

**Goal:** Bot accepts `/project submit`; projects stored and linked to builder; dedicated `/builders/projects` page with filters.

| Task | Details |
|------|--------|
| **4.1 Bot project flow** | `/project submit` in any channel (or DM). Bot DMs user for the flow. Resolve builder by `discord_id`. Collect: project name, description (280), tech stack (fixed list), stage, optional GitHub URL, optional demo URL. Insert into `projects` with `builder_id`. |
| **4.2 Web project create/edit** | Optional for v1: allow authenticated builder to add/edit projects on site (same form constraints). If in scope, add "Add project" on profile edit or dashboard. |
| **4.3 Directory filters** | Add "project count" filter to `/builders` (already in PRD). Ensure project count is available (computed or joined). |
| **4.4 Projects page** | `app/builders/projects/page.tsx`. List all projects with builder name + link to `/builders/[username]`. Filters: stage, tech stack (fixed list). Sort by created_at or similar. English-only. |
| **4.5 Profile page** | Already shows "listed projects"; ensure it reads from `projects` and displays links. |

**Deliverables:** Bot project submission; `/builders/projects` live; directory filter by project count; profile shows projects.

---

## Order and dependencies

```
Phase 0 (Foundation) → Phase 1 (Bot profile) + Phase 2 (Directory + web profile) can run in parallel after 0.
Phase 2 depends on 0 (schema, auth, RLS, fixed lists).
Phase 3 (GitHub) depends on 0 and 2 (directory/profile pages exist).
Phase 4 depends on 0, 1, 2; bot project flow depends on 1 (builder exists).
```

**Suggested sequence:**  
0 → 1 + 2 (in parallel if two devs) → 3 → 4.

---

## Out of scope for this plan

- M5 — Hackathon registration pre-fill
- i18n for /builders (v1 English only)
- Discord OAuth for web auth (using Supabase Auth only per PRD)

---

## Checklist summary

- [x] Phase 0: Schema, RLS, Supabase Auth, fixed lists, Edge Functions, seeds (bot env separate)
- [ ] Phase 1: Discord bot profile create/update, Supabase write, handle uniqueness (separate repo/track)
- [ ] Phase 2: Directory + profile pages, web profile create/edit, filters — see **Phase 2 (Web) — Implementation todo** and [TODO.md](../TODO.md)
- [ ] Phase 3: Vercel Cron GitHub job, profile/directory show GitHub data
- [ ] Phase 4: Bot project submit, /builders/projects, project count filter, profile projects list
