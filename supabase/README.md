# Supabase — Builder Directory (Phase 0)

## Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com). Note your project URL and keys from **Project Settings → API Keys** (publishable key and secret key).

2. **Environment variables**  
   Copy `.env.example` to `.env.local` and set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SECRET_KEY` (server / Edge Functions only; never expose to client)

3. **Run migrations**  
   Either use the Supabase CLI or the Dashboard SQL editor.

### Option A: Supabase CLI

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

Or run migrations manually in order:

```bash
npx supabase db execute -f supabase/migrations/20260227000000_builder_directory_schema.sql
npx supabase db execute -f supabase/migrations/20260227000001_builder_directory_rls.sql
npx supabase db execute -f supabase/migrations/20260227000002_seed_skills_tech_stack.sql
```

### Option B: Dashboard

In **SQL Editor**, run the contents of each file in `migrations/` in order:

1. `20260227000000_builder_directory_schema.sql`
2. `20260227000001_builder_directory_rls.sql`
3. `20260227000002_seed_skills_tech_stack.sql`

## Edge Functions

Deploy (requires Supabase CLI and login):

```bash
npx supabase functions deploy create-builder-profile
npx supabase functions deploy claim-builder-profile
```

Ensure these secrets are set for the project (Dashboard → Project Settings → Edge Functions, or `supabase secrets set`):

- `SUPABASE_URL` (usually set by default)
- `SUPABASE_PUBLISHABLE_KEY` (for verifying user JWTs in the function)
- `SUPABASE_SECRET_KEY` (for admin client / bypassing RLS)

If you use publishable/secret keys with Edge Functions, you may need to deploy with `--no-verify-jwt` and enforce auth inside the function (see [Supabase API keys](https://supabase.com/docs/guides/api/api-keys)).

## Schema reference

See [documentation/SCHEMA.md](../documentation/SCHEMA.md) and [documentation/IMPLEMENTATION_PLAN.md](../documentation/IMPLEMENTATION_PLAN.md).
