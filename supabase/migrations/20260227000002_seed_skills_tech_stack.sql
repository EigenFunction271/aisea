-- Seed reference tables for Builder Directory (Phase 0)
-- Safe to re-run: uses ON CONFLICT DO NOTHING on slug

INSERT INTO public.skills (slug, label, sort_order) VALUES
  ('fullstack', 'Full-stack', 1),
  ('frontend', 'Frontend', 2),
  ('backend', 'Backend', 3),
  ('ml-ai', 'ML / AI', 4),
  ('devtools', 'Dev tools', 5),
  ('mobile', 'Mobile', 6),
  ('data', 'Data / analytics', 7),
  ('infra', 'Infrastructure', 8),
  ('design', 'Design', 9),
  ('product', 'Product', 10)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.tech_stack_options (slug, label, sort_order) VALUES
  ('react', 'React', 1),
  ('nextjs', 'Next.js', 2),
  ('vue', 'Vue', 3),
  ('svelte', 'Svelte', 4),
  ('python', 'Python', 5),
  ('node', 'Node.js', 6),
  ('supabase', 'Supabase', 7),
  ('vercel', 'Vercel', 8),
  ('openai', 'OpenAI API', 9),
  ('anthropic', 'Anthropic / Claude', 10),
  ('langchain', 'LangChain', 11),
  ('vector-db', 'Vector DB (Pinecone, etc.)', 12),
  ('typescript', 'TypeScript', 13),
  ('tailwind', 'Tailwind CSS', 14),
  ('postgres', 'PostgreSQL', 15),
  ('other', 'Other', 99)
ON CONFLICT (slug) DO NOTHING;
