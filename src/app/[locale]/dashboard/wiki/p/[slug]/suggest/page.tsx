import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { WikiEditor } from "../../../_components/wiki-editor";
import type { WikiTreeNode, WikiPageType } from "../../../types";

export default async function WikiSuggestUpdatePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/login`);

  const admin = createAdminClient();

  // Fetch the original live page
  const { data: page } = await admin
    .from("wiki_pages")
    .select("id, slug, title, description, body, type, parent_id")
    .eq("slug", slug)
    .eq("status", "live")
    .maybeSingle();

  if (!page) notFound();

  // Section pages can't be content-updated
  if (page.type === "section") redirect(`/${locale}/dashboard/wiki/p/${slug}`);

  // Tree nodes for parent selector
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
      // Pre-populate with original content but no id → creates NEW proposal row
      suggestedUpdateOf={page.id}
      treeNodes={nodes}
      locale={locale}
      initialValues={{
        title: page.title,
        description: page.description ?? "",
        body: page.body ?? "",
        type: page.type as WikiPageType,
        parentId: page.parent_id ?? "",
      }}
    />
  );
}
