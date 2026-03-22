-- Authors may update their own rows while status is pending_review (amend before approval
-- or withdraw to draft via the app). Previously only draft and needs_update were allowed.

DROP POLICY IF EXISTS "wiki_pages_update_own" ON public.wiki_pages;

CREATE POLICY "wiki_pages_update_own" ON public.wiki_pages
  FOR UPDATE
  TO authenticated
  USING (
    author_id = auth.uid()
    AND status IN ('draft', 'needs_update', 'pending_review')
  )
  WITH CHECK (
    author_id = auth.uid()
    AND status IN ('draft', 'pending_review', 'needs_update')
  );
