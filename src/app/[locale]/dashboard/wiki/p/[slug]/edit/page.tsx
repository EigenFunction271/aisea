import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { WikiEditor } from "../../../_components/wiki-editor";
import type { WikiTreeNode, WikiPageType, WikiPageStatus } from "../../../types";

export default async function WikiEditPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const admin = createAdminClient();

  // Fetch the page
  const { data: page } = await admin
    .from("wiki_pages")
    .select("id, slug, title, description, body, type, status, parent_id, author_id")
    .eq("slug", slug)
    .maybeSingle();

  if (!page) notFound();

  // Check edit permission: author or admin
  const isAuthor = page.author_id === user.id;
  const roleResult = await admin.rpc("get_profile_role", { target_user_id: user.id });
  const role = roleResult.data as string | null;
  const isAdmin = role === "admin" || role === "super_admin";

  if (!isAuthor && !isAdmin) {
    redirect(`/${locale}/dashboard/wiki/p/${slug}`);
  }

  // For non-admin, only allow editing in-progress statuses (not live / rejected)
  if (!isAdmin && !["draft", "needs_update", "pending_review"].includes(page.status)) {
    redirect(`/${locale}/dashboard/wiki/p/${slug}`);
  }

  // Fetch tree nodes for parent selector
  const { data: pages } = await admin
    .from("wiki_pages")
    .select("id, slug, title, type, status, parent_id, sort_order")
    .eq("status", "live")
    .order("sort_order", { ascending: true });

  const rawNodes = pages ?? [];
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
    <WikiEditor
      page={{
        id: page.id,
        slug: page.slug,
        title: page.title,
        description: page.description ?? "",
        body: page.body ?? null,
        type: page.type as WikiPageType,
        parent_id: page.parent_id ?? null,
        status: page.status as WikiPageStatus,
      }}
      treeNodes={nodes}
      locale={locale}
    />
  );
}
