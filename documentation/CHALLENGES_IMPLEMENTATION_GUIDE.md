# Challenges Implementation Guide (v1)

This guide explains how to set up, deploy, and validate the dashboard challenge system end to end.

## 1) What this includes

- Supabase schema for challenges, enrollments, submissions, and anti-spam events
- RLS + storage policies
- Edge Functions for admin/member challenge actions
- Typed app wrappers and dashboard member UI routes

## 2) Files added/updated

### Migrations

- `supabase/migrations/20260319153000_challenges_schema.sql`
- `supabase/migrations/20260319153100_challenges_rls.sql`
- `supabase/migrations/20260319154000_challenge_submission_antispam.sql`

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
- `src/app/[locale]/dashboard/challenges/[challengeId]/page.tsx`
- `src/app/[locale]/dashboard/challenges/[challengeId]/submission-panel.tsx`
- `src/app/[locale]/dashboard/challenges/types.ts`
- `src/app/[locale]/dashboard/dashboard-content.tsx` (adds Challenges CTA)

## 3) Environment requirements

Ensure these env vars are available:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY` (for server admin client usage)
- `SUPABASE_SERVICE_ROLE_KEY` (Edge Function service role)

## 4) Database rollout

Run migrations in order:

1. `20260319153000_challenges_schema.sql`
2. `20260319153100_challenges_rls.sql`
3. `20260319154000_challenge_submission_antispam.sql`

### Role assumptions

- Role source is `profiles.role` with values: `member`, `admin`, `super_admin`
- Profile complete gate requires: `bio`, `username`, `name`, `country`

Note: helper SQL functions are defensive if `profiles` does not exist, but full role/gate behavior depends on that table being present.

## 5) Edge Function deploy

Deploy all challenge functions:

- `manage-challenge`
- `enroll-challenge`
- `upsert-challenge-submission`
- `review-challenge-submission`

Also ensure shared helpers exist under `supabase/functions/_shared`.

## 6) Storage setup

Migration creates private bucket:

- `challenge-submissions`

Client upload path convention:

- `<user_id>/<challenge_id>/<uuid>-<filename>`

Current upload constraints:

- max 5 files per submission
- max 5MB per file
- MIME allowlist in edge function and client checks

## 7) Route map

Member challenge routes:

- List: `/{locale}/dashboard/challenges`
- Detail: `/{locale}/dashboard/challenges/{challengeId}`

Submission actions occur from detail page:

- Enroll
- Save draft
- Submit
- Withdraw
- Upload files to storage

## 8) Admin actions available (API layer)

`manage-challenge` supports:

- `create`
- `update`
- `publish`
- `unpublish`
- `close`
- `archive`
- `set_winners` (closed only)
- `set_owner` (super-admin only)

`review-challenge-submission` supports:

- set status: `under_review`, `accepted`, `rejected`
- attach review decision text

## 9) Verification checklist

After deploy, verify:

1. Non-auth user sees blurred/locked challenge content
2. Auth + incomplete profile user sees locked state and completion CTA
3. Auth + profile-complete user can:
   - enroll
   - save draft submission
   - submit
   - edit/withdraw (until deadline, server-enforced)
4. Admin can manage only own challenges
5. Super-admin can manage all challenges and reassign owner
6. Winners can only be set when challenge status is `closed`
7. Submission read visibility:
   - member: own only
   - admin: own-challenge submissions
   - super-admin: all

## 10) Known follow-ups

- Integrate actual antivirus scanning provider for uploaded files
- Add admin dashboard UI (Slice 4)
- Add notification persistence and delivery hooks (Slice 5)
- Add integration tests for role/state transitions
