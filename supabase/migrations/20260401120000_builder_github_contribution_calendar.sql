-- Cached GitHub contribution grid (official GraphQL API), for accurate profile heatmaps.
-- Populated by Next.js server using viewer OAuth token (owner) or GITHUB_PAT (public user query).

ALTER TABLE public.builders
  ADD COLUMN IF NOT EXISTS github_contribution_calendar jsonb,
  ADD COLUMN IF NOT EXISTS github_contribution_calendar_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS github_contribution_calendar_oauth boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.builders.github_contribution_calendar IS
  'Contribution calendar days: JSON array of {date, count, level} (level 0–4). From GitHub GraphQL.';
COMMENT ON COLUMN public.builders.github_contribution_calendar_updated_at IS
  'When github_contribution_calendar was last refreshed from GitHub.';
COMMENT ON COLUMN public.builders.github_contribution_calendar_oauth IS
  'True when calendar was last synced via the owner''s GitHub OAuth token (viewer query). PAT refresh must not overwrite.';
