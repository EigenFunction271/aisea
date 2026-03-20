-- get_enrollment_counts(challenge_ids uuid[])
-- Returns one row per challenge with the total enrollment count.
-- Used to replace N+1 per-challenge COUNT queries in the challenges list
-- and dashboard home page.
CREATE OR REPLACE FUNCTION get_enrollment_counts(challenge_ids uuid[])
RETURNS TABLE(challenge_id uuid, count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ce.challenge_id, COUNT(*)::bigint AS count
  FROM challenge_enrollments ce
  WHERE ce.challenge_id = ANY(challenge_ids)
  GROUP BY ce.challenge_id;
$$;

GRANT EXECUTE ON FUNCTION get_enrollment_counts(uuid[]) TO authenticated, anon, service_role;
