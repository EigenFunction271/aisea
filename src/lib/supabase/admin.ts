import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client with service role key.
 * Bypasses RLS — use only in API routes, cron, or server actions that need elevated access.
 * Never expose this client or the service role key to the browser.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Accept both names; SUPABASE_SERVICE_ROLE_KEY is the canonical name going forward.
  // SUPABASE_SECRET_KEY is kept as a fallback to avoid breaking existing deployments.
  const secretKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  return createClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
