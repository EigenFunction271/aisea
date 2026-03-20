-- Wiki RLS policies.
--
-- Read matrix:
--   live pages           → any authenticated user
--   draft/pending/needs_update/rejected pages → author + admins only
--
-- Write matrix:
--   insert pages         → any authenticated user (creates as draft)
--   update own draft/needs_update → author
--   update any page      → admin/super_admin
--   insert/update attachments (wiki-public) → contributor + admin
--   insert/update attachments (wiki-private) → admin only
--   insert links         → author of page + admin
--   tree reorder (parent_id / sort_order) → admin only (enforced via policy)

ALTER TABLE public.wiki_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wiki_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wiki_links ENABLE ROW LEVEL SECURITY;

-- ─── wiki_pages ──────────────────────────────────────────────────────────────

-- SELECT: live pages → all authenticated; draft/rejected → author + admin
CREATE POLICY "wiki_pages_select" ON public.wiki_pages
  FOR SELECT
  TO authenticated
  USING (
    status = 'live'
    OR author_id = auth.uid()
    OR auth.uid() = ANY(co_author_ids)
    OR public.get_wiki_role(auth.uid()) = 'admin'
  );

-- INSERT: any authenticated user can create a draft
CREATE POLICY "wiki_pages_insert" ON public.wiki_pages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND status = 'draft'
    -- Only admin can create section pages
    AND (type <> 'section' OR public.get_wiki_role(auth.uid()) = 'admin')
  );

-- UPDATE own draft or needs_update (author)
CREATE POLICY "wiki_pages_update_own" ON public.wiki_pages
  FOR UPDATE
  TO authenticated
  USING (
    author_id = auth.uid()
    AND status IN ('draft', 'needs_update')
  )
  WITH CHECK (
    author_id = auth.uid()
    -- Author can only transition to draft or pending_review
    AND status IN ('draft', 'pending_review', 'needs_update')
    -- Author cannot change parent_id or sort_order (tree structure is admin-only)
    -- Enforced by application layer (edge function) rather than pure RLS
    -- because RLS cannot compare OLD vs NEW without triggers.
  );

-- UPDATE any page → admin only (covers status transitions + tree moves)
CREATE POLICY "wiki_pages_update_admin" ON public.wiki_pages
  FOR UPDATE
  TO authenticated
  USING (public.get_wiki_role(auth.uid()) = 'admin')
  WITH CHECK (public.get_wiki_role(auth.uid()) = 'admin');

-- DELETE → super_admin only (checked via get_profile_role, not get_wiki_role)
CREATE POLICY "wiki_pages_delete" ON public.wiki_pages
  FOR DELETE
  TO authenticated
  USING (public.get_profile_role(auth.uid()) = 'super_admin');

-- ─── wiki_attachments ────────────────────────────────────────────────────────

-- SELECT: wiki-public → all authenticated; wiki-private → all authenticated
-- (bucket-level policies in Storage handle public/private read separately)
CREATE POLICY "wiki_attachments_select" ON public.wiki_attachments
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT wiki-public → contributor or admin
CREATE POLICY "wiki_attachments_insert_public" ON public.wiki_attachments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket = 'wiki-public'
    AND uploader_id = auth.uid()
    AND public.get_wiki_role(auth.uid()) IN ('contributor', 'admin')
  );

-- INSERT wiki-private → admin only
CREATE POLICY "wiki_attachments_insert_private" ON public.wiki_attachments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket = 'wiki-private'
    AND uploader_id = auth.uid()
    AND public.get_wiki_role(auth.uid()) = 'admin'
  );

-- DELETE → uploader or admin
CREATE POLICY "wiki_attachments_delete" ON public.wiki_attachments
  FOR DELETE
  TO authenticated
  USING (
    uploader_id = auth.uid()
    OR public.get_wiki_role(auth.uid()) = 'admin'
  );

-- ─── wiki_links ──────────────────────────────────────────────────────────────

-- SELECT: always visible alongside the page
CREATE POLICY "wiki_links_select" ON public.wiki_links
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: author of the linked page or admin
CREATE POLICY "wiki_links_insert" ON public.wiki_links
  FOR INSERT
  TO authenticated
  WITH CHECK (
    added_by = auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM public.wiki_pages
        WHERE id = page_id AND author_id = auth.uid()
      )
      OR public.get_wiki_role(auth.uid()) = 'admin'
    )
  );

-- UPDATE / DELETE: adder or admin
CREATE POLICY "wiki_links_update" ON public.wiki_links
  FOR UPDATE
  TO authenticated
  USING (
    added_by = auth.uid()
    OR public.get_wiki_role(auth.uid()) = 'admin'
  );

CREATE POLICY "wiki_links_delete" ON public.wiki_links
  FOR DELETE
  TO authenticated
  USING (
    added_by = auth.uid()
    OR public.get_wiki_role(auth.uid()) = 'admin'
  );
