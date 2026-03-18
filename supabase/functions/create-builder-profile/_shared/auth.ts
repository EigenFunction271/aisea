// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * Returns the authenticated user's id (auth.uid()) from the request JWT.
 * Throws if missing or invalid; returns string (uuid).
 */
export async function getUserIdFromRequest(req: Request): Promise<string> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Missing or invalid Authorization header");
  }

  const url = Deno.env.get("SUPABASE_URL");
  const publicKey =
    Deno.env.get("SUPABASE_ANON_KEY") ??
    Deno.env.get("SUPABASE_PUBLISHABLE_KEY");

  if (!url || !publicKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");
  }

  // Use getUser() with forwarded Authorization — reliable in Edge; getClaims() often fails here.
  const supabase = createClient(url, publicKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user?.id) {
    throw new Error(error?.message ?? "Invalid JWT");
  }
  return user.id;
}

export function createAdminClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const secretKey =
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
    Deno.env.get("SUPABASE_SECRET_KEY");

  if (!url || !secretKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in Edge Function env"
    );
  }

  return createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

