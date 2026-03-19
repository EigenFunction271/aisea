// Deno global is available in the Edge Function runtime.
declare const Deno: { env: { get(key: string): string | undefined } };

/**
 * Builds CORS headers for a given request origin.
 *
 * Allowed origins are read from the ALLOWED_ORIGIN env variable (comma-separated).
 * Set it in your Supabase project's Edge Function secrets:
 *   supabase secrets set ALLOWED_ORIGIN=https://yourapp.com,http://localhost:3000
 *
 * If the inbound origin matches an allowed value it is echoed back (required for
 * credentialed requests). If it doesn't match, the first allowed origin is returned
 * so browsers block the cross-origin request while non-browser callers still work.
 */
export function getCorsHeaders(requestOrigin: string | null): Record<string, string> {
  const raw = Deno.env.get("ALLOWED_ORIGIN") ?? "http://localhost:3000";
  const allowedOrigins = raw.split(",").map((s) => s.trim()).filter(Boolean);

  const origin =
    requestOrigin && allowedOrigins.includes(requestOrigin)
      ? requestOrigin
      : allowedOrigins[0];

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
  };
}

/**
 * Convenience helper: returns CORS headers for an OPTIONS pre-flight response.
 * Pass `req.headers.get("origin")` as the argument.
 */
export function getPreflightHeaders(requestOrigin: string | null): Record<string, string> {
  return getCorsHeaders(requestOrigin);
}
