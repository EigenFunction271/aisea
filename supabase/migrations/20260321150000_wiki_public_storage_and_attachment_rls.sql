-- Public storage for wiki file attachments (resource pages).
-- App uploads via service role in API routes; bucket allows public read.

INSERT INTO storage.buckets (id, name, public)
VALUES ('wiki-public', 'wiki-public', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone can read objects (public bucket URLs)
DROP POLICY IF EXISTS "wiki_public_storage_select" ON storage.objects;
CREATE POLICY "wiki_public_storage_select" ON storage.objects
FOR SELECT
USING (bucket_id = 'wiki-public');

-- Writes go through server-side service role (no authenticated INSERT policy)

-- Allow page authors (resource pages) to insert attachment rows, not only wiki contributors
DROP POLICY IF EXISTS "wiki_attachments_insert_public" ON public.wiki_attachments;

CREATE POLICY "wiki_attachments_insert_public" ON public.wiki_attachments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket = 'wiki-public'
    AND uploader_id = auth.uid()
    AND (
      public.get_wiki_role(auth.uid()) IN ('contributor', 'admin')
      OR EXISTS (
        SELECT 1 FROM public.wiki_pages w
        WHERE w.id = page_id
        AND w.type = 'resource'
        AND (w.author_id = auth.uid() OR auth.uid() = ANY (w.co_author_ids))
      )
    )
  );

DROP POLICY IF EXISTS "wiki_attachments_delete" ON public.wiki_attachments;

CREATE POLICY "wiki_attachments_delete" ON public.wiki_attachments
  FOR DELETE
  TO authenticated
  USING (
    uploader_id = auth.uid()
    OR public.get_wiki_role(auth.uid()) = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.wiki_pages w
      WHERE w.id = page_id
      AND (w.author_id = auth.uid() OR auth.uid() = ANY (w.co_author_ids))
    )
  );
