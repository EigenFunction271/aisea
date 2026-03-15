# Builder directory — implementation TODO

**Plan:** [documentation/IMPLEMENTATION_PLAN.md](documentation/IMPLEMENTATION_PLAN.md)  
**Current focus:** Phase 2 (directory + web profile create/edit).

---

## Phase 2 (Web) — ordered tasks

- [x] **2.A Routing** — `/builders` under `[locale]` (e.g. `/en/builders`). v1 English-only copy.
- [x] **2.B Public directory** — `[locale]/builders/page.tsx`: fetch builders + project count; list cards → link to profile.
- [x] **2.C Public profile** — `[locale]/builders/[username]/page.tsx`: fetch by username, 404 if missing; show bio, skills, GitHub, projects list.
- [x] **2.D Edge Function client** — `src/lib/builders/edge-functions.ts`: Zod + `createBuilderProfile` / `claimBuilderProfile`; log errors with context.
- [x] **2.E Web profile create** — `dashboard/create-profile`: form + skills from DB; call Edge Function; redirect on success.
- [x] **2.F Web profile edit** — `dashboard/edit-profile`: load builder via `builder_auth`; pre-filled form; update via Supabase client (RLS).
- [x] **2.G Claim profile** — Lightweight v1: claim by handle only (Edge Function updated to allow no token); document risk. Discord DM verification later.
- [ ] **2.H Directory filters + sort** — City, skills, contribution bands, project count; sort by `github_last_active` desc.
- [x] **2.I Optional: middleware** — Protect `/[locale]/dashboard` in middleware; redirect to `/[locale]/login?next=...` when no session; merge Supabase cookie refresh into response.

---

## Decisions (locked in)

- **Locale:** `/builders` under `[locale]` → `/[locale]/builders` (e.g. `/en/builders`). v1 English-only copy.
- **Claim:** Lightweight v1 — claim by handle only; document risk. Add Discord DM verification later.

---

## Done

- Phase 0: schema, RLS, Edge Functions, seeds, Supabase Auth
- Auth UI: login/signup, callback, redirect to dashboard, `?next=`
- Dashboard: profile status, create/claim CTAs, stubs for create + claim
