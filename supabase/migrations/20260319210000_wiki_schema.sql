-- Wiki schema (Phase 2)
-- Implements the free-form page-tree knowledge base.

-- ─── Types ──────────────────────────────────────────────────────────────────

CREATE TYPE public.wiki_page_type AS ENUM (
  'guide', 'reference', 'resource', 'section'
);

CREATE TYPE public.wiki_page_status AS ENUM (
  'draft', 'pending_review', 'live', 'rejected', 'needs_update'
);

CREATE TYPE public.wiki_link_type AS ENUM (
  'tool', 'paper', 'repo', 'video', 'other'
);

-- ─── wiki_pages ─────────────────────────────────────────────────────────────

CREATE TABLE public.wiki_pages (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                  text NOT NULL UNIQUE,
  parent_id             uuid REFERENCES public.wiki_pages (id) ON DELETE SET NULL,
  sort_order            integer NOT NULL DEFAULT 0,
  type                  public.wiki_page_type NOT NULL DEFAULT 'guide',
  title                 text NOT NULL,
  description           text NOT NULL DEFAULT '',
  body                  text,
  status                public.wiki_page_status NOT NULL DEFAULT 'draft',
  author_id             uuid NOT NULL REFERENCES auth.users (id) ON DELETE RESTRICT,
  co_author_ids         uuid[] NOT NULL DEFAULT '{}',
  reviewed_by           uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  reviewed_at           timestamptz,
  rejection_note        text,
  suggested_update_of   uuid REFERENCES public.wiki_pages (id) ON DELETE CASCADE,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),

  -- section pages have no body requirement; others should have content
  CONSTRAINT wiki_pages_section_no_body CHECK (
    type <> 'section' OR body IS NULL OR body = ''
  )
);

CREATE INDEX wiki_pages_parent_id_idx    ON public.wiki_pages (parent_id);
CREATE INDEX wiki_pages_status_idx       ON public.wiki_pages (status);
CREATE INDEX wiki_pages_author_id_idx    ON public.wiki_pages (author_id);
CREATE INDEX wiki_pages_sort_order_idx   ON public.wiki_pages (parent_id, sort_order);
CREATE INDEX wiki_pages_slug_idx         ON public.wiki_pages (slug);
CREATE INDEX wiki_pages_update_of_idx    ON public.wiki_pages (suggested_update_of)
  WHERE suggested_update_of IS NOT NULL;

-- ─── wiki_attachments ────────────────────────────────────────────────────────

CREATE TABLE public.wiki_attachments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id         uuid NOT NULL REFERENCES public.wiki_pages (id) ON DELETE CASCADE,
  uploader_id     uuid NOT NULL REFERENCES auth.users (id) ON DELETE RESTRICT,
  filename        text NOT NULL,
  storage_path    text NOT NULL,
  bucket          text NOT NULL CHECK (bucket IN ('wiki-public', 'wiki-private')),
  file_size_bytes integer NOT NULL,
  mime_type       text NOT NULL,
  uploaded_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX wiki_attachments_page_id_idx ON public.wiki_attachments (page_id);

-- ─── wiki_links ──────────────────────────────────────────────────────────────

CREATE TABLE public.wiki_links (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id     uuid NOT NULL REFERENCES public.wiki_pages (id) ON DELETE CASCADE,
  url         text NOT NULL,
  title       text NOT NULL,
  description text DEFAULT '',
  link_type   public.wiki_link_type NOT NULL DEFAULT 'other',
  added_by    uuid NOT NULL REFERENCES auth.users (id) ON DELETE RESTRICT,
  added_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX wiki_links_page_id_idx ON public.wiki_links (page_id);

-- ─── updated_at trigger ──────────────────────────────────────────────────────

-- Reuse the set_updated_at function defined in the challenges migration.
CREATE TRIGGER wiki_pages_updated_at
  BEFORE UPDATE ON public.wiki_pages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── builders: is_wiki_contributor ──────────────────────────────────────────

ALTER TABLE public.builders
  ADD COLUMN IF NOT EXISTS is_wiki_contributor boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.builders.is_wiki_contributor IS
  'Set to true automatically when the builder''s first wiki article is approved.';

-- ─── Helper: resolve wiki role for a user ────────────────────────────────────
-- Returns 'admin', 'contributor', or 'member'.
-- Contributor means is_wiki_contributor=true but role='member'.

CREATE OR REPLACE FUNCTION public.get_wiki_role(target_user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  builder_role text;
  is_contributor boolean;
BEGIN
  SELECT b.role, b.is_wiki_contributor
    INTO builder_role, is_contributor
    FROM public.builders b
    JOIN public.builder_auth ba ON ba.builder_id = b.id
   WHERE ba.user_id = target_user_id
   LIMIT 1;

  -- admin/super_admin have full wiki permissions
  IF builder_role IN ('admin', 'super_admin') THEN
    RETURN 'admin';
  END IF;

  -- contributor: can edit own live pages, upload to wiki-public
  IF COALESCE(is_contributor, false) THEN
    RETURN 'contributor';
  END IF;

  RETURN 'member';
END;
$$;

-- ─── Seed: initial page tree ─────────────────────────────────────────────────
-- Creates the 11 root-level section pages from the PRD.
-- author_id is set to a placeholder that admins should update via:
--   UPDATE wiki_pages SET author_id = '<real-admin-uuid>' WHERE status = 'live';
-- We use a DO block to avoid failing if no admin user exists yet.

DO $$
DECLARE
  seed_user_id uuid;
BEGIN
  -- Use the first super_admin or admin from builders as the seed author.
  SELECT ba.user_id
    INTO seed_user_id
    FROM public.builders b
    JOIN public.builder_auth ba ON ba.builder_id = b.id
   WHERE b.role IN ('admin', 'super_admin')
   ORDER BY b.created_at
   LIMIT 1;

  -- If no admin exists yet, skip seed (can be run manually later).
  IF seed_user_id IS NULL THEN
    RAISE NOTICE 'No admin user found — skipping wiki seed pages. Run after granting admin role.';
    RETURN;
  END IF;

  INSERT INTO public.wiki_pages (slug, sort_order, type, title, description, status, author_id)
  VALUES
    ('llm-engineering',   0,  'section', 'LLM Engineering',    'Prompting, evaluation, and production LLM patterns.',           'live', seed_user_id),
    ('agentic-systems',   1,  'section', 'Agentic Systems',     'Autonomous agents, tool use, and multi-agent orchestration.',   'live', seed_user_id),
    ('rag',               2,  'section', 'RAG',                 'Retrieval-augmented generation: chunking, indexing, retrieval.','live', seed_user_id),
    ('fine-tuning',       3,  'section', 'Fine-tuning',         'Training, LoRA, RLHF, and evaluation pipelines.',               'live', seed_user_id),
    ('deployment-infra',  4,  'section', 'Deployment & Infra',  'Serving, scaling, and operating AI in production.',             'live', seed_user_id),
    ('product',           5,  'section', 'Product',             'AI product design, UX patterns, and go-to-market.',             'live', seed_user_id),
    ('data-engineering',  6,  'section', 'Data Engineering',    'Pipelines, data quality, and feature engineering.',             'live', seed_user_id),
    ('frontend',          7,  'section', 'Frontend',            'Building AI-native interfaces and streaming UX.',               'live', seed_user_id),
    ('hardware-edge',     8,  'section', 'Hardware / Edge',     'Edge inference, embedded ML, and on-device AI.',                'live', seed_user_id),
    ('research',          9,  'section', 'Research',            'Papers, methods, and applied research insights.',               'live', seed_user_id),
    ('sea-context',       10, 'section', 'SEA Context',         'Building AI in Southeast Asia — regional constraints, tooling, and deployment realities.', 'live', seed_user_id)
  ON CONFLICT (slug) DO NOTHING;
END $$;
