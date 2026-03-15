import { createClient } from "@/lib/supabase/server";
import { Navbar1 } from "@/components/ui/navbar";
import { Link } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";

type Builder = {
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

export default async function BuildersDirectoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isValidLocale = (loc: string): loc is (typeof routing.locales)[number] =>
    routing.locales.includes(loc as (typeof routing.locales)[number]);
  if (!isValidLocale(locale)) notFound();

  const supabase = await createClient();
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

  const list: Builder[] = (builders ?? []).map((b) => ({
    ...b,
    skills: (b.skills ?? []) as string[],
    project_count: counts[b.id] ?? 0,
  }));

  return (
    <main className="min-h-screen bg-black">
      <Navbar1 />
      <div className="mx-auto max-w-4xl px-4 pt-24 pb-16">
        <h1 className="font-[family-name:var(--font-geist-mono)] text-2xl font-medium text-white">
          Builder directory
        </h1>
        <p className="mt-2 text-white/60">
          Southeast Asia builders in the AI.SEA network.
        </p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {list.map((b) => (
            <li key={b.id}>
              <Link
                href={`/builders/${b.username}`}
                className="block rounded-xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
              >
                <p className="font-medium text-white">{b.name}</p>
                <p className="text-sm text-white/60">
                  @{b.username} · {b.city}
                </p>
                {b.bio && (
                  <p className="mt-2 line-clamp-2 text-sm text-white/70">
                    {b.bio}
                  </p>
                )}
                {b.skills.length > 0 && (
                  <p className="mt-2 text-xs text-white/50">
                    {b.skills.slice(0, 4).join(", ")}
                    {b.skills.length > 4 ? "…" : ""}
                  </p>
                )}
                <p className="mt-2 text-xs text-white/40">
                  {b.project_count} project{b.project_count !== 1 ? "s" : ""}
                  {b.github_handle && ` · GitHub: ${b.github_handle}`}
                </p>
              </Link>
            </li>
          ))}
        </ul>
        {list.length === 0 && (
          <p className="mt-8 text-white/50">No builders in the directory yet.</p>
        )}
      </div>
    </main>
  );
}
