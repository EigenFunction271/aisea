# Challenges Implementation Guide (v1)

This guide explains how to set up, deploy, and validate the dashboard challenge system end to end.

**Status:** Slices 1–4 complete. Slice 5 (notifications, analytics, hardening) pending.

---

## 1) What this includes

- Supabase schema for challenges, enrollments, submissions, anti-spam events
- RLS + storage policies (two buckets)
- Edge Functions for admin/member challenge actions
- Typed Zod schemas and edge function client wrappers
- Dashboard member challenge UI (list, detail, submission flow)
- Admin challenge UI (create/edit, lifecycle controls, winner editor, submission review)

---

## 2) Files added/updated

### Migrations (run in this order)

1. `supabase/migrations/20260319153000_challenges_schema.sql`
2. `supabase/migrations/20260319153100_challenges_rls.sql`
3. `supabase/migrations/20260319154000_challenge_submission_antispam.sql`
4. `supabase/migrations/20260319170000_challenge_assets_storage.sql`

### Edge Functions

- `supabase/functions/_shared/challenges.ts`
- `supabase/functions/manage-challenge/index.ts`
- `supabase/functions/enroll-challenge/index.ts`
- `supabase/functions/upsert-challenge-submission/index.ts`
- `supabase/functions/review-challenge-submission/index.ts`

### App code

- `src/lib/challenges/schemas.ts`
- `src/lib/challenges/edge-functions.ts`
- `src/app/[locale]/dashboard/challenges/page.tsx`
- `src/app/[locale]/dashboard/challenges/challenges-list.tsx`
- `src/app/[locale]/dashboard/challenges/types.ts`
- `src/app/[locale]/dashboard/challenges/[challengeId]/page.tsx`
- `src/app/[locale]/dashboard/challenges/[challengeId]/submission-panel.tsx`
- `src/app/[locale]/dashboard/challenges/admin/page.tsx`
- `src/app/[locale]/dashboard/challenges/admin/loading.tsx`
- `src/app/[locale]/dashboard/challenges/admin/new/page.tsx`
- `src/app/[locale]/dashboard/challenges/admin/challenge-form.tsx`
- `src/app/[locale]/dashboard/challenges/admin/[challengeId]/page.tsx`
- `src/app/[locale]/dashboard/challenges/admin/[challengeId]/loading.tsx`
- `src/app/[locale]/dashboard/challenges/admin/[challengeId]/submission-review-panel.tsx`
- `src/app/[locale]/dashboard/dashboard-content.tsx` (Challenges CTA added)

---

## 3) Environment requirements

Ensure these env vars are set in Vercel and `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY` (server admin client)
- `SUPABASE_SERVICE_ROLE_KEY` (Edge Function service role)

---

## 4) Database rollout

Run migrations in the order listed in section 2.

### Schema creates

- Enums: `challenge_status`, `challenge_enrollment_state`, `challenge_submission_status`
- Tables: `challenges`, `challenge_enrollments`, `challenge_submissions`, `challenge_submission_events`
- Helper functions: `get_profile_role`, `is_profile_complete_for_challenges`, `can_manage_challenge`

### Role assumptions

- Role source: `profiles.role` — values: `member`, `admin`, `super_admin`
- Profile complete gate requires: `bio`, `username`, `name`, `country`
- Helper functions default to `member` role if `profiles` table is absent

### Assign admin/super-admin roles manually

```sql
UPDATE profiles SET role = 'admin' WHERE id = '<user_uuid>';
UPDATE profiles SET role = 'super_admin' WHERE id = '<user_uuid>';
```

---

## 5) Storage setup

Two buckets are created by migrations:

| Bucket | Visibility | Who can write |
|--------|-----------|---------------|
| `challenge-submissions` | Private | Authenticated users (own path only) |
| `challenge-assets` | Public | `admin` + `super_admin` only |

Client upload paths:
- Submissions: `<user_id>/<challenge_id>/<uuid>-<filename>`
- Hero images: `<user_id>/hero/<uuid>-<filename>`

Upload constraints (enforced in edge function + client):
- Max 5 files per submission
- Max 5MB per file
- MIME allowlist: `pdf`, `png`, `jpeg`, `webp`, `txt`, `zip`

---

## 6) Edge Function deploy

```bash
supabase functions deploy manage-challenge
supabase functions deploy enroll-challenge
supabase functions deploy upsert-challenge-submission
supabase functions deploy review-challenge-submission
```

Ensure shared helpers are deployed under `supabase/functions/_shared`.

---

## 7) Route map

### Member routes

| Path | Purpose |
|------|---------|
| `/{locale}/dashboard/challenges` | Challenge feed (active + archived tabs) |
| `/{locale}/dashboard/challenges/{id}` | Challenge detail + submission panel |

### Admin routes

| Path | Purpose |
|------|---------|
| `/{locale}/dashboard/challenges/admin` | Admin challenge list |
| `/{locale}/dashboard/challenges/admin/new` | Create challenge form |
| `/{locale}/dashboard/challenges/admin/{id}` | Edit form + submission review |

Access control: server-side role gate on all admin routes using `get_profile_role` RPC. Non-admin redirects to member feed.

---

## 8) Admin actions (API layer)

`manage-challenge` edge function supports:

| Action | Who | Notes |
|--------|-----|-------|
| `create` | admin, super_admin | Creates draft or published challenge |
| `update` | admin (own), super_admin | Updates any field except status directly |
| `publish` | admin (own), super_admin | Sets status to `published` |
| `unpublish` | admin (own), super_admin | Sets status back to `draft` |
| `close` | admin (own), super_admin | Sets status to `closed` |
| `archive` | admin (own), super_admin | Sets status to `archived` |
| `set_winners` | admin (own), super_admin | Only when status is `closed` |
| `set_owner` | super_admin only | Reassign challenge to another user |

`review-challenge-submission` edge function supports:
- Set status: `under_review`, `accepted`, `rejected`
- Attach review decision text

---

## 9) Verification checklist

After deploy, verify:

1. Unauthenticated user sees blurred teaser cards and CTA
2. Authenticated + incomplete-profile user sees locked state and completion CTA
3. Authenticated + profile-complete user can:
   - enroll explicitly
   - save draft submission
   - submit with URL/text/files
   - edit/withdraw (server blocks after deadline)
4. Admin can manage only own challenges
5. Super-admin can manage all challenges and reassign owner
6. Winners only settable when challenge status is `closed`
7. Archived challenges read-only in Archived tab only
8. Submission visibility:
   - member: own rows only
   - admin: submissions on own-created challenges
   - super-admin: all submissions
9. Rate limit: > 20 submission events/hour returns 429
10. Cooldown: updating twice within 30s returns 429

---

## 10) Known follow-ups (Slice 5)

- In-app notification pipeline (bell + inbox) for challenge lifecycle events
- Analytics event hooks
- Antivirus scanning for uploaded files (MIME/size enforced now; AV provider needed)
- Integration tests for role/state/invariant boundaries
- Admin UX: optimistic refresh after review action, lifecycle button guards, confirm dialogs for close/archive
- Seed migration for demo challenges + staging admin/super-admin users
