-- Add structured submission fields.
-- project_name: the name the builder gives their project.
-- repo_link:    optional source code / repository URL.

ALTER TABLE public.challenge_submissions
  ADD COLUMN IF NOT EXISTS project_name TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS repo_link    TEXT DEFAULT NULL;

COMMENT ON COLUMN public.challenge_submissions.project_name IS
  'Builder-provided project name for the submission';
COMMENT ON COLUMN public.challenge_submissions.repo_link IS
  'Optional repository / source code URL';
