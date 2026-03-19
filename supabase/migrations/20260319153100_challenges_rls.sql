-- RLS and storage policies for challenges (Phase 1)

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_submissions ENABLE ROW LEVEL SECURITY;

-- Challenges:
-- - profile-complete members can read published/archived
-- - admins can manage their own challenges
-- - super_admin can manage all challenges
CREATE POLICY "challenges_select_allowed" ON public.challenges
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND (
    (
      public.is_profile_complete_for_challenges(auth.uid())
      AND status IN ('published', 'archived')
    )
    OR public.can_manage_challenge(auth.uid(), created_by)
  )
);

CREATE POLICY "challenges_insert_admin_only" ON public.challenges
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND public.can_manage_challenge(auth.uid(), created_by)
);

CREATE POLICY "challenges_update_admin_only" ON public.challenges
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND public.can_manage_challenge(auth.uid(), created_by)
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND public.can_manage_challenge(auth.uid(), created_by)
);

CREATE POLICY "challenges_delete_admin_only" ON public.challenges
FOR DELETE
USING (
  auth.uid() IS NOT NULL
  AND public.can_manage_challenge(auth.uid(), created_by)
);

-- Enrollments:
-- - member reads own rows
-- - admins/super_admin can read rows for manageable challenges
CREATE POLICY "challenge_enrollments_select_allowed" ON public.challenge_enrollments
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.challenges c
      WHERE c.id = challenge_id
      AND public.can_manage_challenge(auth.uid(), c.created_by)
    )
  )
);

CREATE POLICY "challenge_enrollments_insert_self" ON public.challenge_enrollments
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
  AND public.is_profile_complete_for_challenges(auth.uid())
  AND EXISTS (
    SELECT 1
    FROM public.challenges c
    WHERE c.id = challenge_id
      AND c.status = 'published'
      AND c.end_at > now()
  )
);

CREATE POLICY "challenge_enrollments_update_allowed" ON public.challenge_enrollments
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.challenges c
      WHERE c.id = challenge_id
      AND public.can_manage_challenge(auth.uid(), c.created_by)
    )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.challenges c
      WHERE c.id = challenge_id
      AND public.can_manage_challenge(auth.uid(), c.created_by)
    )
  )
);

CREATE POLICY "challenge_enrollments_delete_allowed" ON public.challenge_enrollments
FOR DELETE
USING (
  auth.uid() IS NOT NULL
  AND (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.challenges c
      WHERE c.id = challenge_id
      AND public.can_manage_challenge(auth.uid(), c.created_by)
    )
  )
);

-- Submissions:
-- - member reads and writes only own submission
-- - admins/super_admin read all submissions on manageable challenges
CREATE POLICY "challenge_submissions_select_allowed" ON public.challenge_submissions
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.challenges c
      WHERE c.id = challenge_id
      AND public.can_manage_challenge(auth.uid(), c.created_by)
    )
  )
);

CREATE POLICY "challenge_submissions_insert_self" ON public.challenge_submissions
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
  AND public.is_profile_complete_for_challenges(auth.uid())
  AND EXISTS (
    SELECT 1
    FROM public.challenges c
    WHERE c.id = challenge_id
      AND c.status = 'published'
      AND c.end_at > now()
  )
);

CREATE POLICY "challenge_submissions_update_allowed" ON public.challenge_submissions
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.challenges c
      WHERE c.id = challenge_id
      AND public.can_manage_challenge(auth.uid(), c.created_by)
    )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.challenges c
      WHERE c.id = challenge_id
      AND public.can_manage_challenge(auth.uid(), c.created_by)
    )
  )
);

CREATE POLICY "challenge_submissions_delete_allowed" ON public.challenge_submissions
FOR DELETE
USING (
  auth.uid() IS NOT NULL
  AND (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.challenges c
      WHERE c.id = challenge_id
      AND public.can_manage_challenge(auth.uid(), c.created_by)
    )
  )
);

-- Storage bucket for challenge uploads (5MB max enforced in Edge Function/upload flow).
INSERT INTO storage.buckets (id, name, public)
VALUES ('challenge-submissions', 'challenge-submissions', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "challenge_submission_files_select" ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'challenge-submissions'
  AND (
    split_part(name, '/', 1) = auth.uid()::text
    OR public.get_profile_role(auth.uid()) IN ('admin', 'super_admin')
  )
);

CREATE POLICY "challenge_submission_files_insert" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'challenge-submissions'
  AND split_part(name, '/', 1) = auth.uid()::text
);

CREATE POLICY "challenge_submission_files_update" ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'challenge-submissions'
  AND (
    split_part(name, '/', 1) = auth.uid()::text
    OR public.get_profile_role(auth.uid()) IN ('admin', 'super_admin')
  )
)
WITH CHECK (
  bucket_id = 'challenge-submissions'
  AND (
    split_part(name, '/', 1) = auth.uid()::text
    OR public.get_profile_role(auth.uid()) IN ('admin', 'super_admin')
  )
);

CREATE POLICY "challenge_submission_files_delete" ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'challenge-submissions'
  AND (
    split_part(name, '/', 1) = auth.uid()::text
    OR public.get_profile_role(auth.uid()) IN ('admin', 'super_admin')
  )
);
