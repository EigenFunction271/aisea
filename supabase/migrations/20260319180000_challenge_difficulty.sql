-- Add difficulty level to challenges.
-- Nullable so existing rows are unaffected. Enforced as a CHECK constraint
-- rather than an enum so values can be updated without a DDL migration.

ALTER TABLE public.challenges
  ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT NULL
  CHECK (difficulty IN ('starter', 'builder', 'hardcore'));

COMMENT ON COLUMN public.challenges.difficulty IS
  'Optional skill tier: starter | builder | hardcore';
