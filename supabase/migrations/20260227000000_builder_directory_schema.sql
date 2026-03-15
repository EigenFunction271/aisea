-- Builder Directory schema (Phase 0)
-- See documentation/SCHEMA.md

-- Reference tables (fixed lists)
CREATE TABLE public.skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  label text NOT NULL,
  sort_order integer
);

CREATE TABLE public.tech_stack_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  label text NOT NULL,
  sort_order integer
);

-- Builders
CREATE TABLE public.builders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  discord_id text,
  name text NOT NULL,
  city text NOT NULL,
  bio text,
  skills text[] NOT NULL DEFAULT '{}',
  github_handle text,
  linkedin_url text,
  personal_url text,
  github_contributions integer,
  github_last_active date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX builders_discord_id_key ON public.builders (discord_id) WHERE discord_id IS NOT NULL;
CREATE INDEX builders_city_idx ON public.builders (city);
CREATE INDEX builders_github_last_active_idx ON public.builders (github_last_active DESC NULLS LAST);
CREATE INDEX builders_skills_gin ON public.builders USING gin (skills);

-- Projects
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  builder_id uuid NOT NULL REFERENCES public.builders (id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  tech_stack text[] NOT NULL DEFAULT '{}',
  stage text NOT NULL CHECK (stage IN ('idea', 'in_progress', 'shipped')),
  github_url text,
  demo_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX projects_builder_id_idx ON public.projects (builder_id);
CREATE INDEX projects_stage_idx ON public.projects (stage);

-- Link Supabase Auth user to builder (one-to-one)
CREATE TABLE public.builder_auth (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE UNIQUE,
  builder_id uuid NOT NULL REFERENCES public.builders (id) ON DELETE CASCADE UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Updated_at trigger for builders
CREATE OR REPLACE FUNCTION public.set_updated_at()
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

CREATE TRIGGER builders_updated_at
  BEFORE UPDATE ON public.builders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
