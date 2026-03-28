-- Allow profile-complete members to upload hero images under their own prefix (for community proposals).

CREATE POLICY "challenge_assets_insert_member_own_path" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'challenge-assets'
  AND public.is_profile_complete_for_challenges(auth.uid())
  AND split_part(name, '/', 1) = auth.uid()::text
);
