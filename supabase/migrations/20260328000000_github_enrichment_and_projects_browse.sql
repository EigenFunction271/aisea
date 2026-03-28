-- GitHub enrichment + projects browse page
-- Combines:
--   (a) github.md §9 schema changes — enrichment fields on builders + projects
--   (b) project browse additions — self-contained card data so no second table is needed

-- ──────────────────────────────────────────────────────────────────────────────
-- 1. builders — GitHub enrichment fields
-- ──────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.builders
  ADD COLUMN IF NOT EXISTS github_enriched_at        timestamptz,
  ADD COLUMN IF NOT EXISTS github_activity_status    text
    CHECK (github_activity_status IN ('active', 'occasional', 'dormant')),
  ADD COLUMN IF NOT EXISTS github_primary_languages  text[]    NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS github_ai_libs            text[]    NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS github_focus_areas        text[]    NOT NULL DEFAULT '{}',
  -- Internal only — highest README score across repos; never shown to builder
  ADD COLUMN IF NOT EXISTS github_readme_score       integer
    CHECK (github_readme_score BETWEEN 0 AND 100);

COMMENT ON COLUMN public.builders.github_enriched_at       IS 'Timestamp of last successful GitHub enrichment run; null = never enriched';
COMMENT ON COLUMN public.builders.github_activity_status   IS 'Derived from most recent repo push: active (<30d), occasional (31-90d), dormant (>90d)';
COMMENT ON COLUMN public.builders.github_primary_languages IS 'Top 3 programming languages by repo count, from GitHub enrichment';
COMMENT ON COLUMN public.builders.github_ai_libs           IS 'AI libraries detected across all repos (requirements.txt / package.json parsing)';
COMMENT ON COLUMN public.builders.github_focus_areas       IS 'LLM-classified focus areas: agents, RAG, fine-tuning, vision, voice, LLM-infra, data-pipelines, evals, tools-integrations';
COMMENT ON COLUMN public.builders.github_readme_score      IS 'Highest README quality score (0-100) across repos. Internal use only — residency candidate ranking.';

-- Indexes for builder filter/sort queries
CREATE INDEX IF NOT EXISTS builders_github_languages_gin    ON public.builders USING gin (github_primary_languages);
CREATE INDEX IF NOT EXISTS builders_github_ai_libs_gin      ON public.builders USING gin (github_ai_libs);
CREATE INDEX IF NOT EXISTS builders_github_focus_areas_gin  ON public.builders USING gin (github_focus_areas);
CREATE INDEX IF NOT EXISTS builders_activity_status_idx     ON public.builders (github_activity_status);

-- ──────────────────────────────────────────────────────────────────────────────
-- 2. projects — GitHub enrichment fields (per-repo data written by enrich-github)
-- ──────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS github_stars       integer,
  ADD COLUMN IF NOT EXISTS github_last_commit date,
  ADD COLUMN IF NOT EXISTS detected_ai_libs   text[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS readme_summary     text;

COMMENT ON COLUMN public.projects.github_stars       IS 'GitHub star count at time of last enrichment run';
COMMENT ON COLUMN public.projects.github_last_commit IS 'Date of most recent commit, from GitHub API';
COMMENT ON COLUMN public.projects.detected_ai_libs   IS 'AI libraries detected in this repo (subset of builder-level github_ai_libs)';
COMMENT ON COLUMN public.projects.readme_summary     IS 'LLM-generated one-sentence summary of the repo README (Gemini Flash 2.5)';

-- Unique constraint required for upsert idempotency in enrich-github function
-- ON CONFLICT (builder_id, github_url) DO UPDATE ...
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'projects_builder_github_url_key'
      AND conrelid = 'public.projects'::regclass
  ) THEN
    ALTER TABLE public.projects
      ADD CONSTRAINT projects_builder_github_url_key
        UNIQUE (builder_id, github_url);
  END IF;
END $$;

-- ──────────────────────────────────────────────────────────────────────────────
-- 3. projects — browse page additions
--    Self-contained card data so /projects can render without a secondary table.
-- ──────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.projects
  -- Short display headline for card; max 120 chars enforced in app.
  -- Falls back to readme_summary when blank.
  ADD COLUMN IF NOT EXISTS tagline          text,
  -- Cover image / screenshot for the card thumbnail.
  ADD COLUMN IF NOT EXISTS cover_image_url  text,
  -- Opt-out of the public browse page without deleting the project.
  ADD COLUMN IF NOT EXISTS is_public        boolean   NOT NULL DEFAULT true,
  -- Admin highlight flag (pinned to top of browse page).
  ADD COLUMN IF NOT EXISTS featured         boolean   NOT NULL DEFAULT false,
  -- What the project does — directly filterable on browse page.
  -- Separate from builder-level github_focus_areas; set manually or by enrichment.
  -- Allowed values match github.md focus area taxonomy:
  --   agents | RAG | fine-tuning | vision | voice | LLM-infra | data-pipelines | evals | tools-integrations
  ADD COLUMN IF NOT EXISTS focus_areas      text[]    NOT NULL DEFAULT '{}',
  -- Recency sort for browse page; updated whenever the project row changes.
  ADD COLUMN IF NOT EXISTS updated_at       timestamptz NOT NULL DEFAULT now();

COMMENT ON COLUMN public.projects.tagline         IS 'Short display headline for browse card (≤120 chars). Falls back to readme_summary if blank.';
COMMENT ON COLUMN public.projects.cover_image_url IS 'Hero image / screenshot URL for the project card thumbnail';
COMMENT ON COLUMN public.projects.is_public       IS 'When false, project is hidden from the public /projects browse page but still visible to the owner';
COMMENT ON COLUMN public.projects.featured        IS 'Admin flag — pinned / highlighted on the browse page';
COMMENT ON COLUMN public.projects.focus_areas     IS 'What the project does; subset of: agents, RAG, fine-tuning, vision, voice, LLM-infra, data-pipelines, evals, tools-integrations';
COMMENT ON COLUMN public.projects.updated_at      IS 'Last modification time; used for recency sort on browse page';

-- updated_at trigger — keeps updated_at current on every row change
CREATE OR REPLACE FUNCTION public.set_projects_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.set_projects_updated_at();

-- Indexes for browse page queries
CREATE INDEX IF NOT EXISTS projects_is_public_idx        ON public.projects (is_public);
CREATE INDEX IF NOT EXISTS projects_featured_idx         ON public.projects (featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS projects_updated_at_idx       ON public.projects (updated_at DESC);
CREATE INDEX IF NOT EXISTS projects_github_stars_idx     ON public.projects (github_stars DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS projects_focus_areas_gin      ON public.projects USING gin (focus_areas);
CREATE INDEX IF NOT EXISTS projects_detected_ai_libs_gin ON public.projects USING gin (detected_ai_libs);
