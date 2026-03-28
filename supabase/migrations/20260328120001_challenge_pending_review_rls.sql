-- RLS for pending_review (runs after enum value is committed).

DROP POLICY IF EXISTS "challenges_select_allowed" ON public.challenges;
CREATE POLICY "challenges_select_allowed" ON public.challenges
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND (
    (
      public.is_profile_complete_for_challenges(auth.uid())
      AND status IN ('published', 'archived')
    )
    OR (
      public.is_profile_complete_for_challenges(auth.uid())
      AND status = 'pending_review'
      AND created_by = auth.uid()
    )
    OR public.can_manage_challenge(auth.uid(), created_by)
  )
);

DROP POLICY IF EXISTS "challenges_insert_admin_only" ON public.challenges;
DROP POLICY IF EXISTS "challenges_insert_allowed" ON public.challenges;
CREATE POLICY "challenges_insert_allowed" ON public.challenges
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (
    public.can_manage_challenge(auth.uid(), created_by)
    OR (
      auth.uid() = created_by
      AND status = 'pending_review'
      AND public.is_profile_complete_for_challenges(auth.uid())
    )
  )
);

DROP POLICY IF EXISTS "challenges_update_admin_only" ON public.challenges;
DROP POLICY IF EXISTS "challenges_update_allowed" ON public.challenges;
CREATE POLICY "challenges_update_allowed" ON public.challenges
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND (
    public.can_manage_challenge(auth.uid(), created_by)
    OR (
      auth.uid() = created_by
      AND status = 'pending_review'
    )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (
    public.can_manage_challenge(auth.uid(), created_by)
    OR (
      auth.uid() = created_by
      AND status = 'pending_review'
    )
  )
);

DROP POLICY IF EXISTS "challenges_delete_admin_only" ON public.challenges;
DROP POLICY IF EXISTS "challenges_delete_allowed" ON public.challenges;
CREATE POLICY "challenges_delete_allowed" ON public.challenges
FOR DELETE
USING (
  auth.uid() IS NOT NULL
  AND (
    public.can_manage_challenge(auth.uid(), created_by)
    OR (auth.uid() = created_by AND status = 'pending_review')
  )
);
