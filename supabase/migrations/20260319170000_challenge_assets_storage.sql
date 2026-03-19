-- Storage bucket/policies for challenge hero images (admin UI).

INSERT INTO storage.buckets (id, name, public)
VALUES ('challenge-assets', 'challenge-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "challenge_assets_select_public" ON storage.objects
FOR SELECT
USING (bucket_id = 'challenge-assets');

CREATE POLICY "challenge_assets_insert_admin" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'challenge-assets'
  AND public.get_profile_role(auth.uid()) IN ('admin', 'super_admin')
);

CREATE POLICY "challenge_assets_update_admin" ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'challenge-assets'
  AND public.get_profile_role(auth.uid()) IN ('admin', 'super_admin')
)
WITH CHECK (
  bucket_id = 'challenge-assets'
  AND public.get_profile_role(auth.uid()) IN ('admin', 'super_admin')
);

CREATE POLICY "challenge_assets_delete_admin" ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'challenge-assets'
  AND public.get_profile_role(auth.uid()) IN ('admin', 'super_admin')
);
