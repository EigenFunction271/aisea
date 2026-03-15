-- RLS for Builder Directory (Phase 0)
-- Service role and Edge Functions bypass RLS. Anon: read-only on directory tables. Authenticated: no INSERT on builders/builder_auth; UPDATE/DELETE only own builder/projects.

ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tech_stack_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.builders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.builder_auth ENABLE ROW LEVEL SECURITY;

-- skills: read-only for all
CREATE POLICY "skills_select_all" ON public.skills FOR SELECT USING (true);

-- tech_stack_options: read-only for all
CREATE POLICY "tech_stack_options_select_all" ON public.tech_stack_options FOR SELECT USING (true);

-- builders: anon and authenticated can read all; no INSERT (create via Edge Function); UPDATE/DELETE only own row via builder_auth
CREATE POLICY "builders_select_all" ON public.builders FOR SELECT USING (true);
CREATE POLICY "builders_insert_deny" ON public.builders FOR INSERT WITH CHECK (false);
CREATE POLICY "builders_update_own" ON public.builders FOR UPDATE
  USING (id IN (SELECT builder_id FROM public.builder_auth WHERE user_id = auth.uid()));
CREATE POLICY "builders_delete_own" ON public.builders FOR DELETE
  USING (id IN (SELECT builder_id FROM public.builder_auth WHERE user_id = auth.uid()));

-- builder_auth: user can only read own row; no INSERT/UPDATE/DELETE from client (only Edge Functions with service role)
CREATE POLICY "builder_auth_select_own" ON public.builder_auth FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "builder_auth_insert_deny" ON public.builder_auth FOR INSERT WITH CHECK (false);
CREATE POLICY "builder_auth_update_deny" ON public.builder_auth FOR UPDATE USING (false);
CREATE POLICY "builder_auth_delete_deny" ON public.builder_auth FOR DELETE USING (false);

-- projects: anon and authenticated can read all; INSERT/UPDATE/DELETE only for own builder
CREATE POLICY "projects_select_all" ON public.projects FOR SELECT USING (true);
CREATE POLICY "projects_insert_own_builder" ON public.projects FOR INSERT
  WITH CHECK (builder_id IN (SELECT builder_id FROM public.builder_auth WHERE user_id = auth.uid()));
CREATE POLICY "projects_update_own_builder" ON public.projects FOR UPDATE
  USING (builder_id IN (SELECT builder_id FROM public.builder_auth WHERE user_id = auth.uid()));
CREATE POLICY "projects_delete_own_builder" ON public.projects FOR DELETE
  USING (builder_id IN (SELECT builder_id FROM public.builder_auth WHERE user_id = auth.uid()));
