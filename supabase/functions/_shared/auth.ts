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

  const url = Deno.env.get("SUPABASE_URL");
  const publicKey =
    Deno.env.get("SUPABASE_ANON_KEY") ??
    Deno.env.get("SUPABASE_PUBLISHABLE_KEY");

  if (!url || !publicKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");
  }

  const supabase = createClient(url, publicKey);
  // getClaims() performs local JWT verification without a network round-trip.
  // The method exists in @supabase/supabase-js@2 but is not yet included in the public
  // type declarations — cast through unknown to avoid a suppression comment on the whole file.
  const { data, error } = await (
    supabase.auth as unknown as {
      getClaims(token: string): Promise<{
        data: { claims: { sub: string } } | null;
        error: { message: string } | null;
      }>;
    }
  ).getClaims(token);

  const userId = data?.claims?.sub;
  if (error || !userId) {
    throw new Error(error?.message ?? "Invalid JWT");
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
