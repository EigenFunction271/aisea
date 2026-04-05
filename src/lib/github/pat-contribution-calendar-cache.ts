import { unstable_cache } from "next/cache";
import { fetchUserContributionCalendar } from "./contribution-calendar";

/**
 * Deduplicates GitHub GraphQL `user(login)` contribution fetches across requests (PAT path only).
 * Viewer OAuth path must never use this — it is user-specific and must stay fresh.
 */
export const getPatContributionCalendarCached = unstable_cache(
  async (login: string) => {
    const pat = process.env.GITHUB_PAT?.trim();
    if (!pat) {
      throw new Error("GITHUB_PAT not configured");
    }
    return fetchUserContributionCalendar(login, pat);
  },
  ["github-pat-contribution-calendar"],
  { revalidate: 1800 }
);
