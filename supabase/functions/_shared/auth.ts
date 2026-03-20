import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";

// Deno global is available in Supabase Edge Function runtime but not in TypeScript's lib.
// We declare only the subset we use to avoid @ts-nocheck on this security-critical module.
declare const Deno: {
  env: { get(key: string): string | undefined };
};

/**
 * Returns the authenticated user's id (auth.uid()) from the request JWT.
 * Uses getClaims() for local verification (no Auth server call).
 * Throws if missing or invalid; returns string (uuid).
 */
export async function getUserIdFromRequest(req: Request): Promise<string> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Missing or invalid Authorization header");
  }
  const token = authHeader.replace("Bearer ", "").trim();

  // Prefer edge function env vars, but fall back to request headers/origin.
  // In some redeploy states, env vars can be missing while the request still
  // contains the public apikey header used by Supabase.
  const url =
    Deno.env.get("SUPABASE_URL") ?? new URL(req.url).origin;
  const publicKey =
    Deno.env.get("SUPABASE_ANON_KEY") ??
    Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ??
    req.headers.get("apikey") ?? undefined;

  if (!url || !publicKey) throw new Error("Missing SUPABASE_URL or SUPABASE anon/publishable key");

  const supabase = createClient(url, publicKey);
  // getClaims() performs local JWT verification without a network round-trip.
  // The method exists in @supabase/supabase-js@2 but is not yet included in the public
  // type declarations — cast through unknown to avoid a suppression comment on the whole file.
  let data: { claims?: { sub?: string } } | null = null;
  let error: { message: string } | null = null;
  try {
    ({ data, error } = await (
      supabase.auth as unknown as {
        getClaims(token: string): Promise<{
          data: { claims: { sub: string } } | null;
          error: { message: string } | null;
        }>;
      }
    ).getClaims(token));
  } catch (e) {
    // If local verification fails for any runtime reason, we'll fall back to
    // server-side auth verification below.
    error = { message: e instanceof Error ? e.message : "JWT verification failed" };
  }

  // Fallback: if local claim verification fails, ask Auth to validate the JWT.
  if (error || !data?.claims?.sub) {
    // In some edge runtimes we may not be able to verify locally via getClaims().
    // In that case, validate via Auth by sending the token to /user using
    // global Authorization headers.
    const authClient = createClient(url, publicKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    // In supabase-js v2, `auth.getUser()` is not reliably driven by `global.headers.Authorization`
    // in every edge runtime/bundling path. Pass the JWT explicitly for deterministic behavior.
    const userRes = await authClient.auth.getUser(token);
    if (userRes.error || !userRes.data.user?.id) {
      throw new Error(userRes.error?.message ?? error?.message ?? "Invalid JWT");
    }
    return userRes.data.user.id;
  }

  const userId = data?.claims?.sub;
  if (!userId) {
    throw new Error("Invalid JWT");
  }
  return userId;
}

export function createAdminClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  const secretKey =
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SECRET_KEY");
  if (!url || !secretKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in Edge Function env"
    );
  }
  return createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
