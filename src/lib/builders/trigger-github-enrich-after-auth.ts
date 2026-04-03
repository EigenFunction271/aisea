import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { fireEnrichGithubEdgeFunction } from "./enrich-github-edge";
import { githubLoginFromUser } from "./github-identity";

const MIN_INTERVAL_MS = 12 * 60 * 60 * 1000;

/**
 * After a successful OAuth callback: if the user has a GitHub identity and a builder profile,
 * optionally backfill `github_handle`, then queue enrich-github (throttled).
 */
export async function triggerGithubEnrichAfterAuth(opts: {
  user: User;
  accessToken: string;
}): Promise<void> {
  const githubLogin = githubLoginFromUser(opts.user);
  if (!githubLogin) return;

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    return;
  }

  const { data: link } = await admin
    .from("builder_auth")
    .select("builder_id")
    .eq("user_id", opts.user.id)
    .maybeSingle();

  if (!link?.builder_id) return;

  const { data: builder } = await admin
    .from("builders")
    .select("id, github_handle, github_enriched_at")
    .eq("id", link.builder_id)
    .maybeSingle();

  if (!builder?.id) return;

  const row = builder as {
    id: string;
    github_handle: string | null;
    github_enriched_at: string | null;
  };

  let handle = row.github_handle?.trim() ?? "";
  if (!handle) {
    await admin.from("builders").update({ github_handle: githubLogin }).eq("id", row.id);
    handle = githubLogin;
  }

  const enrichedAt = row.github_enriched_at;
  if (enrichedAt) {
    const age = Date.now() - new Date(enrichedAt).getTime();
    if (age < MIN_INTERVAL_MS) return;
  }

  fireEnrichGithubEdgeFunction(opts.accessToken, row.id);
}
