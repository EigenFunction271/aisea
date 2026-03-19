# Implementation Plan: Dashboard Challenges (v1)

**References:** [PRD.md](./PRD.md)  
**Status:** Slices 1–4 complete; Slice 5 pending  
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
- [x] Add storage buckets and object policies
- [x] Add shared challenge Zod schemas in app layer
- [x] SQL helper functions: `get_profile_role`, `is_profile_complete_for_challenges`, `can_manage_challenge`

**Files**
- `supabase/migrations/20260319153000_challenges_schema.sql`
- `supabase/migrations/20260319153100_challenges_rls.sql`
- `supabase/migrations/20260319170000_challenge_assets_storage.sql`
- `src/lib/challenges/schemas.ts`

---

### Slice 2 — Edge action layer (completed)

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
  - cooldown (30s) + per-hour rate limiting (20 events/hr)

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

### Slice 3 — Dashboard member UI (completed)

- [x] Challenge list route with active + archived tabs
- [x] Card UI with hero image, enrollment state, reward text, host, deadline badge
- [x] Blurred preview experience for unauthenticated/incomplete-profile users with CTA redirect
- [x] Challenge detail route with description, eligibility, judging rubric
- [x] Explicit enroll action wired to edge wrapper
- [x] Submission panel: draft/submit/withdraw/edit
- [x] File upload (Supabase Storage, MIME/size checks, per-user path enforcement)
- [x] Card actions: View, Enroll, Submit, Edit Submission (state-aware)
- [x] Closed/archived messaging
- [x] Active + archived empty states
- [x] Admin console CTA visible for admin/super-admin users
- [x] Mobile/tablet responsive parity (sm/xl grid breakpoints)

**Files**
- `src/app/[locale]/dashboard/challenges/page.tsx`
- `src/app/[locale]/dashboard/challenges/challenges-list.tsx`
- `src/app/[locale]/dashboard/challenges/types.ts`
- `src/app/[locale]/dashboard/challenges/[challengeId]/page.tsx`
- `src/app/[locale]/dashboard/challenges/[challengeId]/submission-panel.tsx`
- `src/app/[locale]/dashboard/dashboard-content.tsx` (Challenges CTA added)

---

### Slice 4 — Dashboard admin UI (completed)

- [x] Protected admin challenge list route with thumbnail, subtitle, status
- [x] Create challenge form (admin/super-admin only) with:
  - all required fields (title, subtitle, description, hero image, host, org, dates, timezone, reward, external link, tags, attachments, eligibility, judging rubric)
  - hero image upload to `challenge-assets` storage bucket + URL auto-populate
  - draft autosave/restore (localStorage)
  - preview mode toggle
- [x] Edit challenge form with full field editing
- [x] Lifecycle controls: publish/unpublish/close/archive
- [x] Structured winners editor: per-row user_id, placement, decision_text
  - placement datalist suggestions
  - duplicate user_id + placement validation
  - winners gated to closed challenges
- [x] Submission review panel with:
  - server-side filtering by status
  - server-side pagination (8 per page, URL query-driven)
  - quick stats header: submitted/under_review/accepted/rejected
  - per-submission review actions: Mark Under Review / Accept / Reject
  - decision text input per submission
- [x] Route-level loading skeletons for admin list + detail pages

**Files**
- `src/app/[locale]/dashboard/challenges/admin/page.tsx`
- `src/app/[locale]/dashboard/challenges/admin/loading.tsx`
- `src/app/[locale]/dashboard/challenges/admin/new/page.tsx`
- `src/app/[locale]/dashboard/challenges/admin/challenge-form.tsx`
- `src/app/[locale]/dashboard/challenges/admin/[challengeId]/page.tsx`
- `src/app/[locale]/dashboard/challenges/admin/[challengeId]/loading.tsx`
- `src/app/[locale]/dashboard/challenges/admin/[challengeId]/submission-review-panel.tsx`

---

### Slice 5 — Notifications + analytics + hardening (pending)

#### 5.1 Notification schema
- [ ] Confirm whether existing app notification tables are reusable or add `challenge_notifications` table
- [ ] Add RLS for notification read (user sees own only)

#### 5.2 Notification emit points
Emit in-app notifications for these events:
- [ ] Challenge published (admin emit → enrolled/all users)
- [ ] Enrollment confirmed (emit to enrolling user)
- [ ] Submission received (emit to submitter)
- [ ] Submission status changed (emit to submitter)
- [ ] Winner announced (emit to winner + all enrolled)

#### 5.3 Bell + inbox UI
- [ ] Dashboard notification bell with unread badge
- [ ] Notification inbox panel listing events with read/unread state

#### 5.4 Analytics hooks (low priority)
- [ ] Track: challenge viewed, enrolled, submission created, submission submitted, winner viewed

#### 5.5 Hardening
- [ ] Admin UX: optimistic refresh after review action
- [ ] Admin UX: disable invalid lifecycle buttons based on current challenge status
- [ ] Admin UX: confirmation dialogs for archive and close actions
- [ ] Member UX: optimistic enrollment state update (no reload)
- [ ] Seed migration: demo challenges + staging admin/super-admin users
- [ ] Integration tests for role gate boundaries
- [ ] Integration tests for winner-after-close invariant
- [ ] Integration tests for one-submission-per-user invariant
- [ ] Integration tests for submission edit lock by deadline

#### 5.6 AV scanning (open item)
- [ ] Integrate antivirus scanning provider for uploaded submission files
  - currently enforced: MIME allowlist, 5MB size cap, per-user storage path checks
  - needed: server-side AV scan on upload before metadata stored in submission

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
  - 30s cooldown, 20 updates/hour limit per user/challenge
  - storage path ownership checks (`<user_id>/...`)
  - 5MB per file max; MIME allowlist
- Storage buckets:
  - `challenge-submissions` — private, user-path-scoped
  - `challenge-assets` — public, admin-only write

---

## Definition of Done (v1)

- [x] Users with complete profiles can browse, enroll, submit once, and update until deadline
- [x] Admins can manage only their own challenges; super-admin can manage all
- [x] Winners can be set only after close
- [x] Archived challenges are readable and available only in archived tab
- [x] All writes pass through edge functions with runtime validation + RLS backup
- [x] Mobile/tablet UX parity for core challenge flows
- [ ] In-app notifications for all key lifecycle events
- [ ] Integration test coverage for role/state/invariant boundaries
