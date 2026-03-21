import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ReviewQueue } from "../_components/review-queue";
import { AdminTreeManager } from "../_components/admin-tree-manager";
import type { ReviewItem } from "../_components/review-queue";
import type { WikiTreeNode } from "../types";

const MONO: React.CSSProperties = {
  fontFamily: "var(--font-dm-mono), monospace",
};

export default async function WikiAdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/login`);

  // Guard: admin only
  const { data: role } = await admin.rpc("get_profile_role", {
    target_user_id: user.id,
  });

  if (role !== "admin" && role !== "super_admin") {
    redirect(`/${locale}/dashboard/wiki`);
  }

  const isSuperAdmin = role === "super_admin";

  // ── Pending review queue ─────────────────────────────────────────────────
  const { data: pending } = await admin
    .from("wiki_pages")
    .select("id, slug, title, type, status, updated_at, author_id")
    .in("status", ["pending_review", "needs_update"])
    .order("updated_at", { ascending: true });

  // Resolve author usernames
  const authorIds = [...new Set((pending ?? []).map((p) => p.author_id).filter(Boolean))];
  const authorMap: Record<string, { username: string | null; name: string | null }> = {};

  if (authorIds.length > 0) {
    const { data: auths } = await admin
      .from("builder_auth")
      .select("user_id, builder_id")
      .in("user_id", authorIds);
    const builderIds = (auths ?? []).map((a) => a.builder_id).filter(Boolean);
    if (builderIds.length > 0) {
      const { data: builders } = await admin
        .from("builders")
        .select("id, username, name")
        .in("id", builderIds);
      const bMap: Record<string, { username: string; name: string }> = {};
      for (const b of builders ?? []) bMap[b.id] = { username: b.username, name: b.name };
      for (const a of auths ?? []) {
        if (a.user_id && a.builder_id && bMap[a.builder_id]) {
          authorMap[a.user_id] = bMap[a.builder_id];
        }
      }
    }
  }

  const reviewItems: ReviewItem[] = (pending ?? []).map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    type: p.type,
    status: p.status,
    updated_at: p.updated_at,
    author_username: authorMap[p.author_id]?.username ?? null,
    author_name: authorMap[p.author_id]?.name ?? null,
  }));

  // ── All pages tree for drag-and-drop ─────────────────────────────────────
  const { data: allPages } = await admin
    .from("wiki_pages")
    .select("id, slug, title, type, status, parent_id, sort_order")
    .in("status", ["live", "draft", "pending_review", "needs_update", "rejected"])
    .order("sort_order", { ascending: true });

  const rawNodes = allPages ?? [];
  const parentIds = new Set(rawNodes.map((n) => n.parent_id).filter(Boolean));
  const treeNodes: WikiTreeNode[] = rawNodes.map((n) => ({
    id: n.id,
    slug: n.slug,
    title: n.title,
    type: n.type as WikiTreeNode["type"],
    status: n.status as WikiTreeNode["status"],
    parent_id: n.parent_id,
    sort_order: n.sort_order,
    has_children: parentIds.has(n.id),
  }));

  // ── Stats ────────────────────────────────────────────────────────────────
  const { count: liveCount } = await admin
    .from("wiki_pages")
    .select("id", { count: "exact", head: true })
    .eq("status", "live");

  const { count: draftCount } = await admin
    .from("wiki_pages")
    .select("id", { count: "exact", head: true })
    .eq("status", "draft");

  const stats = [
    { label: "LIVE", value: liveCount ?? 0 },
    { label: "PENDING", value: reviewItems.filter((i) => i.status === "pending_review").length },
    { label: "NEEDS UPDATE", value: reviewItems.filter((i) => i.status === "needs_update").length },
    { label: "DRAFT", value: draftCount ?? 0 },
  ];

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 28px" }}>
      {/* Header */}
      <p style={{ ...MONO, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ds-text-muted)", marginBottom: 10 }}>
        Wiki Admin
      </p>
      <h1 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: 28, fontWeight: 800, color: "var(--ds-text-primary)", marginBottom: 28 }}>
        Review queue & tree
      </h1>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 20, marginBottom: 36, flexWrap: "wrap" }}>
        {stats.map((s) => (
          <div key={s.label} style={{ textAlign: "center" }}>
            <p style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: 28, fontWeight: 800, color: "var(--ds-accent)", lineHeight: 1 }}>
              {s.value}
            </p>
            <p style={{ ...MONO, fontSize: 10, letterSpacing: "0.1em", color: "var(--ds-text-muted)", marginTop: 4 }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Review queue */}
      <section style={{ marginBottom: 48 }}>
        <p style={{ ...MONO, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ds-text-muted)", marginBottom: 14 }}>
          Pending review ({reviewItems.length})
        </p>
        <ReviewQueue items={reviewItems} locale={locale} />
      </section>

      {/* Tree manager */}
      <section>
        <p style={{ ...MONO, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ds-text-muted)", marginBottom: 14 }}>
          Page tree (drag to reorder)
        </p>
        {isSuperAdmin && (
          <p style={{ ...MONO, fontSize: 11, color: "var(--ds-text-muted)", marginBottom: 12 }}>
            Super admins can delete pages or whole branches (sections with children) using Delete on each row.
          </p>
        )}
        <AdminTreeManager initialNodes={treeNodes} locale={locale} isSuperAdmin={isSuperAdmin} />
      </section>
    </div>
  );
}
