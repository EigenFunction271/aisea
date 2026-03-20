import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  page_id: z.string().uuid(),
  action: z.enum(["approve", "reject", "request_changes"]),
  rejection_note: z.string().max(1000).optional(),
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

  // Verify admin role
  const { data: role } = await admin.rpc("get_profile_role", {
    target_user_id: user.id,
  });
  if (role !== "admin" && role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
      { error: parsed.data },
      { status: 422 }
    );
  }

  const { page_id, action, rejection_note } = parsed.data;

  const newStatus =
    action === "approve"
      ? "live"
      : action === "reject"
      ? "rejected"
      : "needs_update";

  const { error } = await admin
    .from("wiki_pages")
    .update({
      status: newStatus,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      rejection_note: rejection_note ?? null,
    })
    .eq("id", page_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // If approving, mark author as contributor if not already
  if (action === "approve") {
    const { data: page } = await admin
      .from("wiki_pages")
      .select("author_id")
      .eq("id", page_id)
      .single();

    if (page?.author_id) {
      const { data: authLink } = await admin
        .from("builder_auth")
        .select("builder_id")
        .eq("user_id", page.author_id)
        .maybeSingle();

      if (authLink?.builder_id) {
        await admin
          .from("builders")
          .update({ is_wiki_contributor: true })
          .eq("id", authLink.builder_id)
          .eq("is_wiki_contributor", false);
      }
    }
  }

  return NextResponse.json({ ok: true, status: newStatus });
}
