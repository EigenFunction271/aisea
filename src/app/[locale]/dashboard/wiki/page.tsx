import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Link } from "@/i18n/routing";
import type { WikiPageType } from "./types";
import { WikiHoverListRowIndent } from "./_components/wiki-hover-surface";

const MONO: React.CSSProperties = {
  fontFamily: "var(--font-dm-mono), monospace",
};

const TYPE_LABELS: Record<WikiPageType, string> = {
  guide: "GUIDE",
  reference: "REF",
  resource: "RESOURCE",
  section: "SECTION",
};

const TYPE_COLORS: Record<WikiPageType, string> = {
  guide: "var(--wiki-approved-badge)",
  reference: "var(--ds-accent)",
  resource: "#fb923c",
  section: "var(--ds-text-muted)",
};

function relativeDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function WikiHomePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  const { q } = await searchParams;
  const admin = createAdminClient();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Recent live pages (excluding section containers)
  const { data: recent } = await admin
    .from("wiki_pages")
    .select("id, slug, title, type, updated_at, parent_id, author_id")
    .eq("status", "live")
    .neq("type", "section")
    .order("updated_at", { ascending: false })
    .limit(8);

  // Search results
  let searchResults: typeof recent = null;
  if (q?.trim()) {
    const { data } = await admin
      .from("wiki_pages")
      .select("id, slug, title, type, description, updated_at, parent_id, author_id")
      .eq("status", "live")
      .or(`title.ilike.%${q}%,description.ilike.%${q}%`)
      .neq("type", "section")
      .order("updated_at", { ascending: false })
      .limit(20);
    searchResults = data;
  }

  // Fetch parent titles for recent + search results
  const parentIds = [
    ...(recent ?? []).map((p) => p.parent_id),
    ...(searchResults ?? []).map((p) => p.parent_id),
  ].filter(Boolean) as string[];

  const parentTitles: Record<string, string> = {};
  if (parentIds.length > 0) {
    const { data: parents } = await admin
      .from("wiki_pages")
      .select("id, title")
      .in("id", [...new Set(parentIds)]);
    for (const p of parents ?? []) parentTitles[p.id] = p.title;
  }

  // Author handles for recent
  const authorIds = [...new Set((recent ?? []).map((p) => p.author_id).filter(Boolean))];
  const authorHandles: Record<string, string> = {};
  if (authorIds.length > 0) {
    const { data: auths } = await admin
      .from("builder_auth")
      .select("user_id, builder_id")
      .in("user_id", authorIds);
    const builderIds = (auths ?? []).map((a) => a.builder_id).filter(Boolean);
    if (builderIds.length > 0) {
      const { data: builders } = await admin
        .from("builders")
        .select("id, username")
        .in("id", builderIds);
      const builderMap: Record<string, string> = {};
      for (const b of builders ?? []) builderMap[b.id] = b.username;
      for (const a of auths ?? []) {
        if (a.user_id && a.builder_id && builderMap[a.builder_id]) {
          authorHandles[a.user_id] = builderMap[a.builder_id];
        }
      }
    }
  }

  const displayList = searchResults ?? recent ?? [];

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 28px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 12 }}>
        <div>
          <p style={{ ...MONO, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ds-text-muted)", marginBottom: 10 }}>
            Community Wiki
          </p>
          <h1 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: 32, fontWeight: 800, color: "var(--ds-text-primary)", lineHeight: 1.2 }}>
            The builder&apos;s field manual.
          </h1>
        </div>
        {user && (
          <Link
            href="/dashboard/wiki/new"
            locale={locale as "en" | "id" | "zh" | "vi"}
            style={{
              ...MONO,
              fontSize: 12,
              padding: "7px 16px",
              borderRadius: 5,
              border: "1px solid var(--ds-border)",
              color: "var(--ds-text-secondary)",
              textDecoration: "none",
              flexShrink: 0,
              transition: "border-color 0.15s",
            }}
          >
            Write a page →
          </Link>
        )}
      </div>

      {/* Search */}
      <form method="GET" style={{ marginBottom: 36 }}>
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search pages, topics, resources…"
          style={{
            ...MONO,
            fontSize: 13,
            width: "100%",
            padding: "10px 14px",
            background: "var(--ds-bg-surface)",
            border: "1px solid var(--ds-border)",
            borderRadius: 6,
            color: "var(--ds-text-primary)",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </form>

      {/* Results or recent */}
      <section>
        <p style={{ ...MONO, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ds-text-muted)", marginBottom: 14 }}>
          {q?.trim() ? `Results for "${q}"` : "Recently Updated"}
        </p>

        {displayList.length === 0 ? (
          <p style={{ fontSize: 14, color: "var(--ds-text-muted)" }}>
            {q?.trim() ? "No pages match your search." : "No pages published yet."}
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {displayList.map((page, i) => (
              <Link
                key={page.id}
                href={`/dashboard/wiki/p/${page.slug}` as Parameters<typeof Link>[0]["href"]}
                locale={locale as "en" | "id" | "zh" | "vi"}
                style={{ textDecoration: "none" }}
              >
                <WikiHoverListRowIndent
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 0",
                    borderTop: i === 0 ? "1px solid var(--ds-border)" : "none",
                    borderBottom: "1px solid var(--ds-border)",
                  }}
                >
                  {/* Type badge */}
                  <span
                    style={{
                      ...MONO,
                      fontSize: 9,
                      letterSpacing: "0.08em",
                      padding: "2px 6px",
                      borderRadius: 3,
                      color: TYPE_COLORS[page.type as WikiPageType],
                      border: `1px solid ${TYPE_COLORS[page.type as WikiPageType]}44`,
                      flexShrink: 0,
                    }}
                  >
                    {TYPE_LABELS[page.type as WikiPageType]}
                  </span>

                  {/* Title */}
                  <span
                    style={{
                      fontFamily: "var(--font-syne), sans-serif",
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--ds-text-primary)",
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {page.title}
                  </span>

                  {/* Meta */}
                  <span style={{ ...MONO, fontSize: 11, color: "var(--ds-text-muted)", flexShrink: 0, display: "flex", gap: 10 }}>
                    {page.parent_id && parentTitles[page.parent_id] && (
                      <span>{parentTitles[page.parent_id]}</span>
                    )}
                    {authorHandles[page.author_id] && (
                      <span>@{authorHandles[page.author_id]}</span>
                    )}
                    <span>{relativeDate(page.updated_at)}</span>
                  </span>
                </WikiHoverListRowIndent>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
