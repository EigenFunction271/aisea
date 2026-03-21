import type { SupabaseClient } from "@supabase/supabase-js";

export type BuilderDirectoryRow = {
  id: string;
  username: string;
  name: string;
  city: string;
  bio: string | null;
  skills: string[];
  github_handle: string | null;
  github_last_active: string | null;
  project_count: number;
};

/**
 * Shared builder directory query + project counts (used by /dashboard/builders).
 */
export async function fetchBuilderDirectoryList(
  supabase: SupabaseClient
): Promise<BuilderDirectoryRow[]> {
  const { data: builders, error: buildersError } = await supabase
    .from("builders")
    .select("id, username, name, city, bio, skills, github_handle, github_last_active")
    .order("github_last_active", { ascending: false, nullsFirst: false });

  if (buildersError) throw new Error("Failed to load builders");

  const builderIds = (builders ?? []).map((b) => b.id);
  let counts: Record<string, number> = {};
  if (builderIds.length > 0) {
    const { data: projects } = await supabase
      .from("projects")
      .select("builder_id")
      .in("builder_id", builderIds);
    counts = (projects ?? []).reduce<Record<string, number>>((acc, p) => {
      acc[p.builder_id] = (acc[p.builder_id] ?? 0) + 1;
      return acc;
    }, {});
  }

  return (builders ?? []).map((b) => ({
    ...b,
    skills: (b.skills ?? []) as string[],
    project_count: counts[b.id] ?? 0,
  }));
}
