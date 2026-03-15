# Builder Directory — Schema

**Status:** Draft  
**Supabase:** PostgreSQL + Row Level Security (RLS) + Edge Functions

**Decisions:** Username is **editable**. Discord-created profiles are linked to web via **claim profile**. Fixed lists live in **reference tables**. Profile create and claim are done via **Edge Functions** (no client INSERT into `builder_auth`).

---

## Reference tables (fixed lists)

### `skills`

| Column | Type | Nullable | Notes |
|--------|------|----------|--------|
| `id` | `uuid` | NO | PK, default `gen_random_uuid()` |
| `slug` | `text` | NO | **Unique**; e.g. `react`, `python` |
| `label` | `text` | NO | Display label |
| `sort_order` | `integer` | YES | For consistent ordering in UI/bot |

- Bot and web both read from this table; `builders.skills` stores an array of these **slugs**.

### `tech_stack_options`

| Column | Type | Nullable | Notes |
|--------|------|----------|--------|
| `id` | `uuid` | NO | PK, default `gen_random_uuid()` |
| `slug` | `text` | NO | **Unique**; e.g. `nextjs`, `supabase` |
| `label` | `text` | NO | Display label |
| `sort_order` | `integer` | YES | For consistent ordering |

- `projects.tech_stack` stores an array of these **slugs**. App and bot validate slugs exist in this table on insert/update.

---

## Core tables

### `builders`

| Column | Type | Nullable | Notes |
|--------|------|----------|--------|
| `id` | `uuid` | NO | PK, default `gen_random_uuid()` |
| `username` | `text` | NO | Chosen handle; **unique**; used in `/builders/[username]`. **Editable** — old URLs 404 unless we add redirects later. |
| `discord_id` | `text` | YES | Unique when set; links bot user to this profile. Null if profile created only on web. |
| `name` | `text` | NO | |
| `city` | `text` | NO | |
| `bio` | `text` | YES | Max 160 chars enforced in app/bot |
| `skills` | `text[]` | NO | Default `'{}'`; **slugs** from `skills` table |
| `github_handle` | `text` | YES | |
| `linkedin_url` | `text` | YES | |
| `personal_url` | `text` | YES | |
| `github_contributions` | `integer` | YES | Filled by cron; null until first sync |
| `github_last_active` | `date` | YES | Filled by cron |
| `created_at` | `timestamptz` | NO | Default `now()` |
| `updated_at` | `timestamptz` | NO | Default `now()` |

- **Unique constraints:** `username`, `discord_id` (where not null — use unique partial index or unique constraint that allows one null).
- **Indexes:** `username` (unique), `discord_id` (unique), `city`, `github_last_active` (for sort), GIN on `skills` for filter.

*(Username is editable; old profile URLs 404 unless we add redirects later.)*


---

### `projects`

| Column | Type | Nullable | Notes |
|--------|------|----------|--------|
| `id` | `uuid` | NO | PK, default `gen_random_uuid()` |
| `builder_id` | `uuid` | NO | FK → `builders.id` ON DELETE CASCADE |
| `name` | `text` | NO | |
| `description` | `text` | YES | Max 280 chars enforced in app/bot |
| `tech_stack` | `text[]` | NO | Default `'{}'`; **slugs** from `tech_stack_options` |
| `stage` | `text` | NO | Check: `stage IN ('idea','in_progress','shipped')` |
| `github_url` | `text` | YES | |
| `demo_url` | `text` | YES | |
| `created_at` | `timestamptz` | NO | Default `now()` |

- **Indexes:** `builder_id`, `stage` (for filters on project listing).

---

### `builder_auth` (link Supabase Auth ↔ builder)

One-to-one: one auth user to one builder. All inserts go through Edge Functions (service role); no client INSERT. Used for RLS: only the linked user can edit that builder row.

| Column | Type | Nullable | Notes |
|--------|------|----------|--------|
| `id` | `uuid` | NO | PK, default `gen_random_uuid()` |
| `user_id` | `uuid` | NO | FK → `auth.users.id`; **unique** (one auth user → one builder) |
| `builder_id` | `uuid` | NO | FK → `builders.id` ON DELETE CASCADE; **unique** (one builder → one auth user) |
| `created_at` | `timestamptz` | NO | Default `now()` |

- **Create profile (web):** Client calls Edge Function with profile payload. Function inserts `builders` (no discord_id), then `builder_auth` with `auth.uid()` and the new `builder_id`.
- **Claim profile (web):** User has a profile created via Discord. They sign in, enter their handle; we verify (e.g. one-time code to Discord DM), then client calls Edge Function with handle + token. Function verifies, finds builder by username, inserts `builder_auth`. Verification TBD (see **Claim profile — verification** below).

---

## Edge Functions

| Function | Purpose | Auth |
|----------|--------|------|
| **create-builder-profile** | Profile payload (username, name, city, skills[], etc.). Validates username unique, skills slugs exist. Inserts `builders` + `builder_auth` with `auth.uid()`. Returns builder. | JWT required; service role in function. |
| **claim-builder-profile** | Username + verification token. Validates token, finds builder, ensures not already linked, inserts `builder_auth` for `auth.uid()`. | JWT required; service role in function. |

- **builder_auth:** RLS denies all client INSERT/UPDATE/DELETE; only Edge Functions (service role) mutate it.
- **builders:** No client INSERT; creation only via Edge Function. Authenticated can only UPDATE/DELETE own builder (via builder_auth).

---

## Row Level Security (RLS)

- **Service role** (cron, bot, Edge Functions): bypasses RLS; full read/write.
- **Anonymous:** can **read** `builders`, `projects`, `skills`, `tech_stack_options` only (public directory).
- **Authenticated:**  
  - **builders:** no INSERT (create only via Edge Function); SELECT all; UPDATE/DELETE only own row (via builder_auth) and **select/update/delete** only the row linked in `builder_auth` for `auth.uid()`. No arbitrary insert of `builder_auth` from client (that would let users link to someone else’s profile). So: **insert** into `builders` allowed; **insert** into `builder_auth` must be restricted (e.g. only allow when `builder_id` is the just-inserted builder and `user_id = auth.uid()` — e.g. in a trigger or in a small Postgres function called from a secure context).  
  - **projects:** can **insert** (with `builder_id` = their builder), **update/delete** only projects where `builder_id` = their builder (via `builder_auth`).

Concretely:

1. **builders**  
   - `SELECT`: allow all (public).  
   - `INSERT`: deny for authenticated (creation only via Edge Function).  
   - `UPDATE` / `DELETE`: allow only where `id IN (SELECT builder_id FROM builder_auth WHERE user_id = auth.uid())`.

2. **builder_auth**  
   - `SELECT`: allow only where `user_id = auth.uid()`.  
   - `INSERT` / `UPDATE` / `DELETE`: deny for authenticated (only Edge Functions with service role).
3. **projects** `user_id = auth.uid()` and `builder_id` is “the builder they just created” or “claimed” via a trusted path (e.g. server-side or edge function that checks claim token / Discord match). So we likely **disallow direct client INSERT** and do the link in a Supabase Edge Function or API route that validates the claim.  
3. **projects**  
   - `SELECT`: allow all.  
   - `INSERT`: allow where authenticated and `builder_id IN (SELECT builder_id FROM builder_auth WHERE user_id = auth.uid())`.  
   - `UPDATE` / `DELETE`: same condition as INSERT (only their builder’s projects).

4. **skills**, **tech_stack_options**
   - `SELECT`: allow all.
   - No write from client (optional: allow only service role for admin seeding).

---

## Claim profile — verification (TBD)

To prevent someone claiming another builder's profile by guessing the handle, we need a verification step. Options:

- **Discord DM:** Builder enters handle; we look up builder, get `discord_id`, bot sends a one-time code in DM; user enters code on site; Edge Function verifies and creates `builder_auth`. Requires bot to expose a "send claim code" action (or Edge Function calls Discord API if we have bot token in env).
- **Email:** If we store email on builder (we don't today), send magic link or code. Not in current schema.
- **Lighter-trust v1:** For launch, "claim" could be low-friction (e.g. just enter handle and we link); we add verification in a later iteration. Document risk: anyone who knows a handle could claim it until we add verification.

Recommendation: implement **Discord DM verification** (bot sends code; user submits code to Edge Function) so that only the Discord account that created the profile can claim it. Edge Function then needs a way to trigger "send code to discord_id" (e.g. call bot webhook or bot polls a `pending_claims` table).
