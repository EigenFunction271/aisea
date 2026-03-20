import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { WikiEditor } from "../_components/wiki-editor";
import type { WikiTreeNode } from "../types";

export default async function WikiNewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const admin = createAdminClient();

  // Fetch tree nodes for parent selector (live sections + other pages)
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

  return <WikiEditor treeNodes={nodes} locale={locale} />;
}
