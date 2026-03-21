import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { collectSubtreeRows, postOrderDeleteIds } from "@/lib/wiki/subtree-delete";

const schema = z.object({
  page_id: z.string().uuid(),
  cascade: z.boolean().optional().default(false),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { data: role } = await admin.rpc("get_profile_role", {
    target_user_id: user.id,
  });
  if (role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden — super admin only" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join("; ") },
      { status: 422 }
    );
  }

  const { page_id, cascade } = parsed.data;

  const { data: page } = await admin.from("wiki_pages").select("id").eq("id", page_id).maybeSingle();
  if (!page) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  const { count: childCount } = await admin
    .from("wiki_pages")
    .select("id", { count: "exact", head: true })
    .eq("parent_id", page_id);

  const n = childCount ?? 0;
  if (n > 0 && !cascade) {
    return NextResponse.json(
      {
        error:
          "This page has child pages or sections. Pass cascade=true to delete the entire branch, or move children in the tree first.",
        childCount: n,
      },
      { status: 409 }
    );
  }

  if (cascade && n > 0) {
    const { data: allRows, error: fetchErr } = await admin.from("wiki_pages").select("id, parent_id");
    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }
    const subtree = collectSubtreeRows(page_id, allRows ?? []);
    const order = postOrderDeleteIds(page_id, subtree);
    for (const id of order) {
      const { error: delErr } = await admin.from("wiki_pages").delete().eq("id", id);
      if (delErr) {
        return NextResponse.json({ error: delErr.message }, { status: 500 });
      }
    }
    return NextResponse.json({ ok: true, deleted: order.length });
  }

  const { error } = await admin.from("wiki_pages").delete().eq("id", page_id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, deleted: 1 });
}
