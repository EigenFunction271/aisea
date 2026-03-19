-- Challenges schema (Phase 1)
-- Implements the foundational data model for dashboard challenges.

CREATE TYPE public.challenge_status AS ENUM ('draft', 'published', 'closed', 'archived');
CREATE TYPE public.challenge_enrollment_state AS ENUM ('not_enrolled', 'enrolled', 'submitted', 'closed', 'archived');
CREATE TYPE public.challenge_submission_status AS ENUM ('draft', 'submitted', 'under_review', 'accepted', 'rejected', 'withdrawn');

CREATE TABLE public.challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES auth.users (id) ON DELETE RESTRICT,
  title text NOT NULL,
  subtitle text NOT NULL,
  description text NOT NULL,
  hero_image_url text,
  host_name text NOT NULL,
  org_name text NOT NULL,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  timezone text NOT NULL,
  reward_text text NOT NULL,
  external_link text,
  status public.challenge_status NOT NULL DEFAULT 'draft',
  tags text[] NOT NULL DEFAULT '{}',
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  eligibility text NOT NULL,
  judging_rubric text NOT NULL,
  winners jsonb NOT NULL DEFAULT '[]'::jsonb,
  published_at timestamptz,
  closed_at timestamptz,
  archived_at timestamptz,
  winner_announced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT challenges_start_before_end CHECK (end_at > start_at)
);

CREATE INDEX challenges_status_idx ON public.challenges (status);
CREATE INDEX challenges_created_by_idx ON public.challenges (created_by);
CREATE INDEX challenges_start_at_idx ON public.challenges (start_at);
CREATE INDEX challenges_end_at_idx ON public.challenges (end_at);
CREATE INDEX challenges_tags_gin ON public.challenges USING gin (tags);

CREATE TABLE public.challenge_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.challenges (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  state public.challenge_enrollment_state NOT NULL DEFAULT 'enrolled',
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (challenge_id, user_id)
);

CREATE INDEX challenge_enrollments_user_idx ON public.challenge_enrollments (user_id);
CREATE INDEX challenge_enrollments_challenge_idx ON public.challenge_enrollments (challenge_id);
CREATE INDEX challenge_enrollments_state_idx ON public.challenge_enrollments (state);

CREATE TABLE public.challenge_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.challenges (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  status public.challenge_submission_status NOT NULL DEFAULT 'draft',
  submission_url text,
  submission_text text,
  submission_files jsonb NOT NULL DEFAULT '[]'::jsonb,
  review_decision_text text,
  reviewed_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (challenge_id, user_id)
);

CREATE INDEX challenge_submissions_user_idx ON public.challenge_submissions (user_id);
CREATE INDEX challenge_submissions_challenge_idx ON public.challenge_submissions (challenge_id);
CREATE INDEX challenge_submissions_status_idx ON public.challenge_submissions (status);

-- Reuse existing updated_at helper trigger from prior migrations.
CREATE TRIGGER challenges_updated_at
  BEFORE UPDATE ON public.challenges
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER challenge_enrollments_updated_at
  BEFORE UPDATE ON public.challenge_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER challenge_submissions_updated_at
  BEFORE UPDATE ON public.challenge_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Helper: read role from public.profiles if table exists.
CREATE OR REPLACE FUNCTION public.get_profile_role(target_user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  detected_role text;
BEGIN
  IF to_regclass('public.profiles') IS NULL THEN
    RETURN 'member';
  END IF;

  EXECUTE 'SELECT role FROM public.profiles WHERE id = $1'
    INTO detected_role
    USING target_user_id;

  RETURN COALESCE(detected_role, 'member');
END;
$$;

-- Helper: profile completeness gate for challenge access.
-- Requirement: bio, username, name, country must be set.
CREATE OR REPLACE FUNCTION public.is_profile_complete_for_challenges(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_complete boolean;
BEGIN
  IF to_regclass('public.profiles') IS NULL THEN
    RETURN false;
  END IF;

  EXECUTE
    'SELECT (coalesce(trim(bio), '''') <> '''')
         AND (coalesce(trim(username), '''') <> '''')
         AND (coalesce(trim(name), '''') <> '''')
         AND (coalesce(trim(country), '''') <> '''')
     FROM public.profiles
     WHERE id = $1'
    INTO is_complete
    USING target_user_id;

  RETURN COALESCE(is_complete, false);
END;
$$;

CREATE OR REPLACE FUNCTION public.can_manage_challenge(target_user_id uuid, challenge_owner_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.get_profile_role(target_user_id) = 'super_admin'
    OR (
      public.get_profile_role(target_user_id) = 'admin'
      AND target_user_id = challenge_owner_id
    );
$$;
