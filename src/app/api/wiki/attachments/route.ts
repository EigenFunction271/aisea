import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function canManageAttachments(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  page: { author_id: string; co_author_ids: string[] | null }
): Promise<boolean> {
  if (page.author_id === userId) return true;
  if (page.co_author_ids?.includes(userId)) return true;
  const { data: role } = await admin.rpc("get_profile_role", { target_user_id: userId });
  return role === "admin" || role === "super_admin";
}

export async function GET(req: Request) {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const pageId = searchParams.get("page_id");
  const parsed = z.string().uuid().safeParse(pageId);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid page_id" }, { status: 422 });
  }

  const { data: page } = await admin
    .from("wiki_pages")
    .select("id, type")
    .eq("id", parsed.data)
    .maybeSingle();

  if (!page) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (page.type !== "resource") {
    return NextResponse.json({ attachments: [] });
  }

  const { data: rows, error } = await admin
    .from("wiki_attachments")
    .select("id, filename, storage_path, bucket, file_size_bytes, mime_type, uploaded_at")
    .eq("page_id", parsed.data)
    .order("uploaded_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ attachments: rows ?? [] });
}

export async function DELETE(req: Request) {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const idParsed = z.string().uuid().safeParse(searchParams.get("id"));
  if (!idParsed.success) {
    return NextResponse.json({ error: "Invalid id" }, { status: 422 });
  }
  const attId = idParsed.data;

  const { data: att, error: fetchErr } = await admin
    .from("wiki_attachments")
    .select("id, page_id, storage_path, bucket, uploader_id")
    .eq("id", attId)
    .maybeSingle();

  if (fetchErr || !att) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: page } = await admin
    .from("wiki_pages")
    .select("id, type, author_id, co_author_ids")
    .eq("id", att.page_id)
    .maybeSingle();

  if (!page) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  const allowed =
    att.uploader_id === user.id || (await canManageAttachments(admin, user.id, page));

  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error: delDb } = await admin.from("wiki_attachments").delete().eq("id", attId);
  if (delDb) {
    return NextResponse.json({ error: delDb.message }, { status: 500 });
  }

  if (att.bucket === "wiki-public") {
    await admin.storage.from("wiki-public").remove([att.storage_path]);
  }

  return NextResponse.json({ ok: true });
}
