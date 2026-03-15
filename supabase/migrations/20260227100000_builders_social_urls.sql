-- Add Instagram and Twitter/X URLs to builders (optional social links)
ALTER TABLE public.builders
  ADD COLUMN IF NOT EXISTS instagram_url text,
  ADD COLUMN IF NOT EXISTS twitter_url text;

COMMENT ON COLUMN public.builders.instagram_url IS 'Instagram profile URL';
COMMENT ON COLUMN public.builders.twitter_url IS 'Twitter/X profile URL';
