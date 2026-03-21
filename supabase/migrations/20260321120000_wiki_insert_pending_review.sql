-- Allow authors to insert new wiki pages directly as pending_review (submit for review).
-- Previously INSERT only allowed status = 'draft', but upsert-page sends pending_review
-- for new pages when the user clicks "Submit for review", causing RLS violations.

DROP POLICY IF EXISTS "wiki_pages_insert" ON public.wiki_pages;

CREATE POLICY "wiki_pages_insert" ON public.wiki_pages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND status IN ('draft', 'pending_review')
    AND (type <> 'section' OR public.get_wiki_role(auth.uid()) = 'admin')
  );
