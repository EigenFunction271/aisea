import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_BYTES = 10 * 1024 * 1024;

const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "text/plain",
  "text/markdown",
]);

function safeFilename(name: string): string {
  const base = name.replace(/[^a-zA-Z0-9._-]/g, "_");
  return base.slice(0, 180) || "file";
}

/** Strip MIME parameters (e.g. `application/pdf; charset=binary` → `application/pdf`). */
function normalizeDeclaredMime(raw: string | undefined): string {
  if (!raw) return "";
  return raw.split(";")[0].trim().toLowerCase();
}

function mimeFromExtension(filename: string): string | null {
  const ext = filename.toLowerCase().split(".").pop() ?? "";
  const byExt: Record<string, string> = {
    pdf: "application/pdf",
    zip: "application/zip",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    gif: "image/gif",
    txt: "text/plain",
    md: "text/markdown",
    markdown: "text/markdown",
  };
  const m = byExt[ext];
  return m && ALLOWED_MIME.has(m) ? m : null;
}

/**
 * Resolve a canonical MIME for storage + DB. Browsers often send `type;params` which does not
 * match ALLOWED_MIME exactly; some PDFs report `application/octet-stream` until read.
 */
function resolveMime(file: File): string {
  const declared = normalizeDeclaredMime(file.type);
  if (declared && ALLOWED_MIME.has(declared)) return declared;

  if (declared === "application/octet-stream") {
    const fromExt = mimeFromExtension(file.name);
    if (fromExt) return fromExt;
  }

  const fromExt = mimeFromExtension(file.name);
  return fromExt ?? "";
}

/** Safe display name for DB (no NUL / control chars). */
function sanitizeFilenameForDb(name: string): string {
  const cleaned = name.replace(/\0/g, "").replace(/[\u0001-\u001F\u007F]/g, "");
  return cleaned.slice(0, 255) || "file";
}

function friendlyStorageError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("pattern") || m.includes("invalidkey") || m.includes("invalid key")) {
    return `${message} — Try renaming the file to use only letters, numbers, and .-_ or use a shorter name. If this persists, check Storage → wiki-public allowed MIME types in the Supabase dashboard.`;
  }
  if (m.includes("mime") || m.includes("content-type") || m.includes("invalidmimetype")) {
    return `${message} — The file type could not be accepted. Try a standard PDF export or rename to end in .pdf.`;
  }
  return message;
}

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

export async function POST(req: Request) {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 });
  }

  const pageIdRaw = formData.get("page_id");
  const file = formData.get("file");
  const pageIdParsed = z.string().uuid().safeParse(
    typeof pageIdRaw === "string" ? pageIdRaw.trim() : null
  );
  if (!pageIdParsed.success) {
    return NextResponse.json({ error: "Invalid page_id" }, { status: 422 });
  }
  const pid = pageIdParsed.data;

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Missing or empty file" }, { status: 422 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 422 });
  }

  const mime = resolveMime(file);
  if (!mime) {
    return NextResponse.json(
      { error: "Unsupported file type (use PDF, zip, images, txt, or markdown)" },
      { status: 422 }
    );
  }

  const { data: page } = await admin
    .from("wiki_pages")
    .select("id, type, author_id, co_author_ids")
    .eq("id", pid)
    .maybeSingle();

  if (!page) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  if (page.type !== "resource") {
    return NextResponse.json({ error: "Attachments are only allowed on resource pages" }, { status: 400 });
  }

  const allowed = await canManageAttachments(admin, user.id, page);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const path = `pages/${pid}/${crypto.randomUUID()}-${safeFilename(file.name)}`;
  const contentType = normalizeDeclaredMime(mime) || mime;

  const { error: upErr } = await admin.storage.from("wiki-public").upload(path, buf, {
    contentType,
    upsert: false,
  });

  if (upErr) {
    return NextResponse.json({ error: friendlyStorageError(upErr.message) }, { status: 500 });
  }

  const { data: row, error: insErr } = await admin
    .from("wiki_attachments")
    .insert({
      page_id: pid,
      uploader_id: user.id,
      filename: sanitizeFilenameForDb(file.name),
      storage_path: path,
      bucket: "wiki-public",
      file_size_bytes: buf.length,
      mime_type: mime,
    })
    .select("id, filename, storage_path, bucket, file_size_bytes, mime_type, uploaded_at")
    .single();

  if (insErr) {
    await admin.storage.from("wiki-public").remove([path]);
    return NextResponse.json({ error: insErr.message }, { status: 500 });
  }

  return NextResponse.json({ attachment: row });
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
    att.uploader_id === user.id ||
    (await canManageAttachments(admin, user.id, page));

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
