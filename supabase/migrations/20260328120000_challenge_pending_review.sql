-- Add enum value only (must be committed before any policy/SQL can reference it).
-- See 20260328120001_challenge_pending_review_rls.sql for RLS updates.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'challenge_status' AND e.enumlabel = 'pending_review'
  ) THEN
    ALTER TYPE public.challenge_status ADD VALUE 'pending_review';
  END IF;
END $$;
