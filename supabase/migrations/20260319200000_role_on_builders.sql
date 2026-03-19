-- Consolidate role management onto the existing builders table.
-- Eliminates the need for a separate public.profiles table.
--
-- get_profile_role()            → reads builders.role via builder_auth
-- is_profile_complete_for_challenges() → checks builders row exists + required fields set
-- can_manage_challenge()        → unchanged (calls get_profile_role internally)

-- 1. Add role column to builders
ALTER TABLE public.builders
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'member'
  CHECK (role IN ('member', 'admin', 'super_admin'));

COMMENT ON COLUMN public.builders.role IS
  'Access tier: member (default) | admin (own challenges) | super_admin (all challenges)';

-- 2. Rewrite get_profile_role to use builders via builder_auth
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
  SELECT b.role
    INTO detected_role
    FROM public.builders b
    JOIN public.builder_auth ba ON ba.builder_id = b.id
   WHERE ba.user_id = target_user_id
   LIMIT 1;

  RETURN COALESCE(detected_role, 'member');
END;
$$;

-- 3. Rewrite is_profile_complete_for_challenges to use builders via builder_auth.
--    Completion = builder row exists with username, name, and city all non-empty.
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
  SELECT (
      coalesce(trim(b.username), '') <> ''
    AND coalesce(trim(b.name),    '') <> ''
    AND coalesce(trim(b.city),    '') <> ''
  )
    INTO is_complete
    FROM public.builders b
    JOIN public.builder_auth ba ON ba.builder_id = b.id
   WHERE ba.user_id = target_user_id
   LIMIT 1;

  RETURN COALESCE(is_complete, false);
END;
$$;
