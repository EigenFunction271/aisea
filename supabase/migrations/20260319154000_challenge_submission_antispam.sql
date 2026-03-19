-- Anti-spam support for challenge submissions (Phase 2)

CREATE TABLE public.challenge_submission_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.challenges (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('create', 'update', 'submit', 'withdraw')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX challenge_submission_events_user_idx
  ON public.challenge_submission_events (user_id, created_at DESC);

CREATE INDEX challenge_submission_events_challenge_idx
  ON public.challenge_submission_events (challenge_id, created_at DESC);

ALTER TABLE public.challenge_submission_events ENABLE ROW LEVEL SECURITY;

-- Read own events only; writes happen through Edge Functions using service role.
CREATE POLICY "challenge_submission_events_select_own" ON public.challenge_submission_events
FOR SELECT
USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "challenge_submission_events_insert_deny" ON public.challenge_submission_events
FOR INSERT
WITH CHECK (false);

CREATE POLICY "challenge_submission_events_update_deny" ON public.challenge_submission_events
FOR UPDATE
USING (false);

CREATE POLICY "challenge_submission_events_delete_deny" ON public.challenge_submission_events
FOR DELETE
USING (false);
