import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/routing";
import { notFound, redirect } from "next/navigation";
import { routing } from "@/i18n/routing";
import { fetchBuilderDirectoryList } from "@/lib/builders/directory-list";

export const revalidate = 120;

export default async function DashboardBuildersDirectoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isValidLocale = (loc: string): loc is (typeof routing.locales)[number] =>
    routing.locales.includes(loc as (typeof routing.locales)[number]);
  if (!isValidLocale(locale)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=/${locale}/dashboard/builders`);

  const list = await fetchBuilderDirectoryList(supabase);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <h1
        className="text-2xl font-bold"
        style={{ fontFamily: "var(--font-syne), sans-serif", color: "var(--ds-text-primary)" }}
      >
        Builder directory
      </h1>
      <p className="mt-2 text-sm" style={{ color: "var(--ds-text-secondary)" }}>
        Southeast Asia builders in the AI.SEA network.
      </p>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((b) => (
          <li key={b.id}>
            <Link
              href={`/dashboard/u/${b.username}`}
              locale={locale as "en" | "id" | "zh" | "vi"}
              className="block rounded-lg p-5 transition-colors"
              style={{
                border: "1px solid var(--ds-border)",
                backgroundColor: "var(--ds-bg-surface)",
              }}
            >
              <p
                className="font-semibold"
                style={{ fontFamily: "var(--font-syne), sans-serif", color: "var(--ds-text-primary)" }}
              >
                {b.name}
              </p>
              <p
                className="mt-1 text-sm"
                style={{ fontFamily: "var(--font-dm-mono), monospace", color: "var(--ds-text-muted)" }}
              >
                @{b.username} · {b.city}
              </p>
              {b.bio && (
                <p
                  className="mt-2 line-clamp-2 text-sm"
                  style={{ color: "var(--ds-text-secondary)" }}
                >
                  {b.bio}
                </p>
              )}
              {b.skills.length > 0 && (
                <p
                  className="mt-2 text-[11px] uppercase tracking-wider"
                  style={{ fontFamily: "var(--font-dm-mono), monospace", color: "var(--ds-text-muted)" }}
                >
                  {b.skills.slice(0, 4).join(", ")}
                  {b.skills.length > 4 ? "…" : ""}
                </p>
              )}
              <p
                className="mt-2 text-[11px]"
                style={{ fontFamily: "var(--font-dm-mono), monospace", color: "var(--ds-text-muted)" }}
              >
                {b.project_count} project{b.project_count !== 1 ? "s" : ""}
                {b.github_handle ? ` · GitHub: ${b.github_handle}` : ""}
              </p>
            </Link>
          </li>
        ))}
      </ul>

      {list.length === 0 && (
        <p className="mt-8 text-sm" style={{ color: "var(--ds-text-muted)" }}>
          No builders in the directory yet.
        </p>
      )}
    </div>
  );
}
