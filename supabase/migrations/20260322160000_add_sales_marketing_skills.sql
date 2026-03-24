-- Add additional builder directory skills/tags.
-- These automatically show up in profile create/edit UI (CreateProfileForm/EditProfileForm)
-- and in profile display once the builder selects them.

INSERT INTO public.skills (slug, label, sort_order) VALUES
  ('sales', 'Sales', 11),
  ('marketing', 'Marketing', 12)
ON CONFLICT (slug) DO NOTHING;

