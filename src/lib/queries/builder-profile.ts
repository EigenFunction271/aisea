import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export type CachedBuilderProfile = {
  builderId: string;
  id: string;
  name: string;
  city: string;
  username: string;
  role: string;
  bio: string | null;
  skills: string[];
  github_handle: string | null;
} | null;

async function fetchBuilderProfile(userId: string): Promise<CachedBuilderProfile> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("builder_auth")
    .select("builder_id, builders(id, name, city, username, role, bio, skills, github_handle)")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data?.builder_id || !data.builders) return null;

  const b = data.builders as unknown as {
    id: string;
    name: string;
    city: string;
    username: string;
    role: string;
    bio: string | null;
    skills: string[] | null;
    github_handle: string | null;
  };

  return {
    builderId: data.builder_id,
    id: b.id,
    name: b.name,
    city: b.city,
    username: b.username,
    role: b.role,
    bio: b.bio,
    skills: (b.skills ?? []) as string[],
    github_handle: b.github_handle,
  };
}

/**
 * Cached builder profile lookup by auth user id.
 * TTL: 60 s. Invalidate with revalidateTag(`builder-profile:${userId}`)
 * after a profile update.
 */
export const getCachedBuilderProfile = unstable_cache(
  fetchBuilderProfile,
  ["builder-profile"],
  { revalidate: 60, tags: ["builder-profile"] }
);
