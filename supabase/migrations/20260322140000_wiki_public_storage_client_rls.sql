-- Client-side uploads to wiki-public bypass Vercel body limits; enforce path + page rules here.

-- Authenticated users may INSERT objects under pages/{page_id}/... for resource pages they may
-- attach to (aligned with wiki_attachments_insert_public).
DROP POLICY IF EXISTS "wiki_public_storage_insert" ON storage.objects;
CREATE POLICY "wiki_public_storage_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'wiki-public'
    AND split_part(name, '/', 1) = 'pages'
    AND EXISTS (
      SELECT 1
      FROM public.wiki_pages w
      WHERE w.id = (split_part(name, '/', 2))::uuid
      AND w.type = 'resource'
      AND (
        public.get_wiki_role(auth.uid()) IN ('contributor', 'admin')
        OR w.author_id = auth.uid()
        OR auth.uid() = ANY (w.co_author_ids)
      )
    )
  );

-- DELETE only when the object matches an attachment row the user may remove (uploader, page
-- author/coauthor, or wiki admin). Prevents contributors from deleting arbitrary paths.
DROP POLICY IF EXISTS "wiki_public_storage_delete" ON storage.objects;
CREATE POLICY "wiki_public_storage_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'wiki-public'
    AND split_part(name, '/', 1) = 'pages'
    AND (
      public.get_wiki_role(auth.uid()) = 'admin'
      OR EXISTS (
        SELECT 1
        FROM public.wiki_attachments a
        JOIN public.wiki_pages w ON w.id = a.page_id
        WHERE a.bucket = 'wiki-public'
        AND a.storage_path = name
        AND (
          a.uploader_id = auth.uid()
          OR w.author_id = auth.uid()
          OR auth.uid() = ANY (w.co_author_ids)
        )
      )
    )
  );
