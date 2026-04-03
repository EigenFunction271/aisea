import type { User } from "@supabase/supabase-js";

/** GitHub login from Supabase identity (OAuth maps `login` → `user_name` in identity_data). */
export function githubLoginFromUser(user: User | null): string | null {
  if (!user) return null;
  const gh = user.identities?.find((i) => i.provider === "github");
  if (!gh?.identity_data || typeof gh.identity_data !== "object") return null;
  const data = gh.identity_data as Record<string, unknown>;
  for (const key of ["user_name", "preferred_username", "name"] as const) {
    const v = data[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}
