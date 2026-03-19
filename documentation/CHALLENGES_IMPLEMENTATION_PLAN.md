# Implementation Plan: Dashboard Challenges (v1)

**References:** [PRD.md](./PRD.md)  
**Status:** In progress  
**Feature principle:** atomic slices only; no big-bang merge

---

## Scope (approved)

v1 includes:
- challenge list + detail
- enrollment states
- deadlines, rewards, judging, winners
- admin/super-admin role model from `profiles.role`
- explicit enrollment, single submission per user/challenge
- submission drafts + edits until deadline
- archived tab (read-only)
- protected admin dashboard create/edit/review
- RLS + Edge Function wrappers + runtime validation
- anti-spam checks, notifications hooks, storage-backed file uploads

---

## Delivery Slices

### Slice 1 — Data foundation (completed)
- [x] Create challenge tables/enums in Supabase migrations
- [x] Add RLS for challenge read/write boundaries
- [x] Add storage bucket and storage object policies
- [x] Add shared challenge Zod schemas in app layer

**Files**
- `supabase/migrations/20260319153000_challenges_schema.sql`
- `supabase/migrations/20260319153100_challenges_rls.sql`
- `src/lib/challenges/schemas.ts`

---

### Slice 2 — Edge action layer (current)

#### 2.1 Admin edge actions
- [x] `manage-challenge` function with actions:
  - create
  - update
  - publish/unpublish
  - close/archive
  - set winners (close-gated)
  - set owner (super-admin only)

#### 2.2 Member edge actions
- [x] `enroll-challenge` (explicit enrollment, profile completeness gate)
- [x] `upsert-challenge-submission`:
  - one submission row per user/challenge
  - draft/submit/withdraw transitions
  - submission edit lock after deadline
  - enrollment required
  - MIME/type + file ownership checks
  - cooldown + per-hour rate limiting

#### 2.3 Admin review edge action
- [x] `review-challenge-submission` for review status and decision text

#### 2.4 Typed client wrappers
- [x] `src/lib/challenges/edge-functions.ts` for safe typed invocation

#### 2.5 Anti-spam persistence
- [x] `challenge_submission_events` migration

**Files**
- `supabase/functions/_shared/challenges.ts`
- `supabase/functions/manage-challenge/index.ts`
- `supabase/functions/enroll-challenge/index.ts`
- `supabase/functions/upsert-challenge-submission/index.ts`
- `supabase/functions/review-challenge-submission/index.ts`
- `supabase/migrations/20260319154000_challenge_submission_antispam.sql`
- `src/lib/challenges/edge-functions.ts`

---

### Slice 3 — Dashboard member UI
- [ ] Add dashboard challenge list route and card UI (active + archived tabs)
- [ ] Add blurred preview experience for unauthenticated/incomplete-profile users
- [ ] Add challenge detail route
- [ ] Wire enroll + submission actions to edge wrappers
- [ ] Add submission draft/edit form with deadline lock state
- [ ] Add mobile/tablet responsive parity

---

### Slice 4 — Dashboard admin UI
- [ ] Add protected admin challenge routes under dashboard
- [ ] Create challenge form with autosave draft, preview, image upload
- [ ] Edit/publish/unpublish/archive controls
- [ ] Submission review UI with status decisions
- [ ] Winners editor (multi-placement text decisions, only after close)

---

### Slice 5 — Notifications + analytics + hardening
- [ ] Add notification emit points for:
  - challenge published
  - enrollment confirmed
  - submission received
  - review status changed
  - winner announced
- [ ] Add dashboard bell + inbox query integration
- [ ] Add low-priority analytics hooks
- [ ] Add integration tests for role gates and state transitions

---

## Data & Security Decisions (implemented)

- Role source: `profiles.role` (fallback to `member` when missing)
- Profile completeness for challenge access: requires `bio`, `username`, `name`, `country`
- Read access:
  - non-admin: published/archived only (with profile completion gate)
  - admin: own challenges + owned challenge submissions
  - super-admin: all challenges/submissions
- Write access:
  - challenge management only via edge function role checks
  - enrollment/submission only for authenticated, profile-complete users
- Submission guardrails:
  - unique row per `(challenge_id, user_id)`
  - cooldown and per-hour rate limit
  - storage path ownership checks
  - 5MB per file max; MIME allowlist

---

## Open Technical Items

- Implement true antivirus scanning integration for uploaded files (currently MIME + path ownership + size checks are enforced in edge flow; AV provider hook still needed).
- Add challenge notification storage schema if existing app notification tables are not reusable.
- Add seed migration for demo challenges/admin users after confirming target staging accounts.

---

## Definition of Done (v1)

- Users with complete profiles can browse, enroll, submit once, and update until deadline.
- Admins can manage only their own challenges; super-admin can manage all.
- Winners can be set only after close.
- Archived challenges are readable and available only in archived tab.
- All writes pass through edge functions with runtime validation + RLS backup.
- Mobile/tablet UX parity for core challenge flows.
