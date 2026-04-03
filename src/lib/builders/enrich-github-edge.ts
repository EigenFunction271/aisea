/**
 * Fire-and-forget call to enrich-github Edge Function (same contract as POST /api/builders/enrich).
 * Caller must pass a valid user JWT; the function validates builder ownership.
 */
export function fireEnrichGithubEdgeFunction(
  accessToken: string,
  builderId: string
): void {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
  if (!url || !serviceKey) {
    return;
  }

  void fetch(`${url}/functions/v1/enrich-github`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      apikey: serviceKey,
    },
    body: JSON.stringify({ builder_id: builderId }),
  }).catch((err) => {
    console.error("[enrich-github] fire-and-forget failed:", err);
  });
}
