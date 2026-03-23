import type { SupabaseClient } from "@supabase/supabase-js";
import {
  WIKI_ATTACHMENT_MAX_BYTES,
  WIKI_ATTACHMENT_MAX_MB,
  friendlyWikiStorageError,
  normalizeDeclaredMime,
  resolveWikiAttachmentMime,
  safeFilename,
  sanitizeFilenameForDb,
} from "@/lib/wiki/attachment-rules";

export type WikiAttachmentRow = {
  id: string;
  filename: string;
  storage_path: string;
  bucket: string;
  file_size_bytes: number;
  mime_type: string;
  uploaded_at: string;
};

/**
 * Upload directly to Supabase Storage + insert `wiki_attachments` with the user session.
 * Avoids Vercel’s ~4.5 MB serverless request body limit on multipart POST to Next.js.
 */
export async function uploadWikiAttachmentClient(
  supabase: SupabaseClient,
  pageId: string,
  file: File
): Promise<WikiAttachmentRow> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Unauthenticated");
  }

  if (file.size === 0) {
    throw new Error("Empty file");
  }
  if (file.size > WIKI_ATTACHMENT_MAX_BYTES) {
    throw new Error(`File too large (max ${WIKI_ATTACHMENT_MAX_MB} MB)`);
  }

  const mime = resolveWikiAttachmentMime(file);
  if (!mime) {
    throw new Error("Unsupported file type (use PDF, zip, images, txt, or markdown)");
  }

  const path = `pages/${pageId}/${crypto.randomUUID()}-${safeFilename(file.name)}`;
  const contentType = normalizeDeclaredMime(mime) || mime;

  const { error: upErr } = await supabase.storage.from("wiki-public").upload(path, file, {
    contentType,
    upsert: false,
  });

  if (upErr) {
    throw new Error(friendlyWikiStorageError(upErr.message));
  }

  const { data: row, error: insErr } = await supabase
    .from("wiki_attachments")
    .insert({
      page_id: pageId,
      uploader_id: user.id,
      filename: sanitizeFilenameForDb(file.name),
      storage_path: path,
      bucket: "wiki-public",
      file_size_bytes: file.size,
      mime_type: mime,
    })
    .select("id, filename, storage_path, bucket, file_size_bytes, mime_type, uploaded_at")
    .single();

  if (insErr) {
    await supabase.storage.from("wiki-public").remove([path]);
    throw new Error(insErr.message);
  }

  return row as WikiAttachmentRow;
}
