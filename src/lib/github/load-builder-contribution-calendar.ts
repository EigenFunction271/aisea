import type { SupabaseClient } from "@supabase/supabase-js";
import {
  CachedActivitiesSchema,
  fetchUserContributionCalendar,
  fetchViewerContributionCalendar,
  type ContributionActivity,
} from "./contribution-calendar";

const VIEWER_REFRESH_MS = 6 * 60 * 60 * 1000;
const PAT_REFRESH_MS = 24 * 60 * 60 * 1000;

export type BuilderContributionLoadResult = {
  activities: ContributionActivity[];
  totalContributions: number;
};

function parseCache(raw: unknown): ContributionActivity[] | null {
  const p = CachedActivitiesSchema.safeParse(raw);
  return p.success ? p.data : null;
}

function isOlderThan(updatedAt: string | null, ms: number): boolean {
  if (!updatedAt) return true;
  return Date.now() - new Date(updatedAt).getTime() > ms;
}

function totalFromActivities(activities: ContributionActivity[]): number {
  return activities.reduce((s, d) => s + d.count, 0);
}

/**
 * Loads contribution calendar for a builder profile.
 * - Owner + GitHub OAuth session token: GitHub `viewer` query (matches logged-in GitHub totals).
 * - Else: server `GITHUB_PAT` + `user(login)` when allowed (won't overwrite oauth-sourced cache).
 * - Visitors reuse DB cache only (no token); first fill happens when owner visits or PAT backfill runs.
 */
export async function loadBuilderContributionCalendar(opts: {
  admin: SupabaseClient;
  builderId: string;
  githubHandle: string | null;
  cachedJson: unknown;
  cachedUpdatedAt: string | null;
  calendarOauth: boolean;
  isOwner: boolean;
  sessionProviderToken: string | null | undefined;
}): Promise<BuilderContributionLoadResult | null> {
  const {
    admin,
    builderId,
    githubHandle,
    cachedJson,
    cachedUpdatedAt,
    calendarOauth,
    isOwner,
    sessionProviderToken,
  } = opts;

  if (!githubHandle?.trim()) return null;
  const login = githubHandle.trim();
  const cached = parseCache(cachedJson);
  const pat = process.env.GITHUB_PAT?.trim();

  async function persist(
    activities: ContributionActivity[],
    totalContributions: number,
    fromOauth: boolean
  ) {
    await admin
      .from("builders")
      .update({
        github_contribution_calendar: activities,
        github_contribution_calendar_updated_at: new Date().toISOString(),
        github_contribution_calendar_oauth: fromOauth,
        github_contributions: totalContributions,
      })
      .eq("id", builderId);
  }

  // 1) Owner: refresh from GitHub OAuth viewer token (private-inclusive if enabled on GitHub)
  if (
    isOwner &&
    sessionProviderToken &&
    isOlderThan(cachedUpdatedAt, VIEWER_REFRESH_MS)
  ) {
    try {
      const v = await fetchViewerContributionCalendar(sessionProviderToken);
      if (v.login.toLowerCase() === login.toLowerCase()) {
        await persist(v.activities, v.totalContributions, true);
        return {
          activities: v.activities,
          totalContributions: v.totalContributions,
        };
      }
    } catch {
      // e.g. token is Google, expired, or wrong provider
    }
  }

  // 2) Use DB cache if still within refresh window for this viewer type
  if (cached && cached.length > 0) {
    const cacheCadenceMs =
      isOwner && sessionProviderToken ? VIEWER_REFRESH_MS : PAT_REFRESH_MS;
    if (!isOlderThan(cachedUpdatedAt, cacheCadenceMs)) {
      return {
        activities: cached,
        totalContributions: totalFromActivities(cached),
      };
    }
  }

  // 3) PAT backfill / refresh — never overwrite oauth-sourced calendar
  const allowPat =
    Boolean(pat) &&
    !calendarOauth &&
    (!cached || cached.length === 0 || isOlderThan(cachedUpdatedAt, PAT_REFRESH_MS));

  if (allowPat && pat) {
    try {
      const u = await fetchUserContributionCalendar(login, pat);
      await persist(u.activities, u.totalContributions, false);
      return {
        activities: u.activities,
        totalContributions: u.totalContributions,
      };
    } catch {
      // rate limit, user missing, etc.
    }
  }

  if (cached && cached.length > 0) {
    return {
      activities: cached,
      totalContributions: totalFromActivities(cached),
    };
  }

  return null;
}
