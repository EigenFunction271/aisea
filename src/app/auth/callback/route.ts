import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { routing } from "@/i18n/routing";
import { dedupeLeadingLocalePath } from "@/lib/i18n/dedupe-locale-path";
import { triggerGithubEnrichAfterAuth } from "@/lib/builders/trigger-github-enrich-after-auth";

/**
 * Handles the redirect from Supabase after OAuth (e.g. Google), magic links, or email confirmation.
 * Exchanges the `code` in the URL for a session and redirects to `next` (same-origin only).
 *
 * Configure in Supabase Dashboard:
 * Authentication → URL Configuration → Redirect URLs:
 *   - http://localhost:3000/auth/callback (dev)
 *   - https://yourdomain.com/auth/callback (prod)
 * Authentication → Providers → Google / GitHub: enable and add OAuth client ID/secret.
 *
 * After a successful exchange, users with a GitHub identity and a builder profile may have
 * `github_handle` backfilled and `enrich-github` queued (throttled — see triggerGithubEnrichAfterAuth).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  // Prevent open redirect: only allow same-origin paths (reject absolute URLs and protocol-relative URLs like //evil.com)
  const rawNext =
    searchParams.get("next") ?? `/${routing.defaultLocale}/dashboard`;
  const safe =
    rawNext.startsWith("/") && !rawNext.startsWith("//")
      ? rawNext
      : `/${routing.defaultLocale}/dashboard`;
  const next = dedupeLeadingLocalePath(safe);

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

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (user && session?.access_token) {
    try {
      await triggerGithubEnrichAfterAuth({
        user,
        accessToken: session.access_token,
      });
    } catch (err) {
      console.error("[auth/callback] triggerGithubEnrichAfterAuth:", err);
    }
  }

  return NextResponse.redirect(new URL(next, request.url));
}
