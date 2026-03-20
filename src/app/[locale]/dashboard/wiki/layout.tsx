import { createAdminClient } from "@/lib/supabase/admin";
import { WikiTreePanel } from "./_components/wiki-tree-panel";
import type { WikiTreeNode } from "./types";

export default async function WikiLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const admin = createAdminClient();

  // Fetch all live (and section) pages for the tree — no body needed, just metadata
  const { data: pages } = await admin
    .from("wiki_pages")
    .select("id, slug, title, type, status, parent_id, sort_order")
    .in("status", ["live"])
    .order("sort_order", { ascending: true });

  const rawNodes = pages ?? [];

  // Compute has_children flag
  const parentIds = new Set(rawNodes.map((n) => n.parent_id).filter(Boolean));
  const nodes: WikiTreeNode[] = rawNodes.map((n) => ({
    id: n.id,
    slug: n.slug,
    title: n.title,
    type: n.type as WikiTreeNode["type"],
    status: n.status as WikiTreeNode["status"],
    parent_id: n.parent_id,
    sort_order: n.sort_order,
    has_children: parentIds.has(n.id),
  }));

  return (
    <div style={{ display: "flex", height: "calc(100dvh - 48px)", overflow: "hidden" }}>
      {/* Wiki tree panel — hidden on mobile, 240px on desktop */}
      <aside
        className="hidden lg:flex"
        style={{
          width: 240,
          flexShrink: 0,
          borderRight: "1px solid var(--ds-border)",
          backgroundColor: "var(--ds-bg-base)",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <WikiTreePanel nodes={nodes} locale={locale} />
      </aside>

      {/* Main content area */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {children}
      </div>
    </div>
  );
}
