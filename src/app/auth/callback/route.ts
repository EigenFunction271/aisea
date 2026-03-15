import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Handles the redirect from Supabase after email confirmation (or other auth redirects).
 * Exchanges the `code` in the URL for a session and redirects to the default locale home.
 *
 * Configure in Supabase Dashboard:
 * Authentication → URL Configuration → Redirect URLs:
 *   - http://localhost:3000/auth/callback (dev)
 *   - https://yourdomain.com/auth/callback (prod)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url)
    );
  }

  return NextResponse.redirect(new URL(next, request.url));
}
