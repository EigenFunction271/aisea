/** Shared validation for wiki resource attachments (client + server). */

/** Keep at or below Supabase Storage per-object limit (project/bucket settings; often 50 MB). */
export const WIKI_ATTACHMENT_MAX_MB = 25;
export const WIKI_ATTACHMENT_MAX_BYTES = WIKI_ATTACHMENT_MAX_MB * 1024 * 1024;

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

export function safeFilename(name: string): string {
  const base = name.replace(/[^a-zA-Z0-9._-]/g, "_");
  return base.slice(0, 180) || "file";
}

/** Strip MIME parameters (e.g. `application/pdf; charset=binary` → `application/pdf`). */
export function normalizeDeclaredMime(raw: string | undefined): string {
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
export function resolveWikiAttachmentMime(file: File): string {
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
export function sanitizeFilenameForDb(name: string): string {
  const cleaned = name.replace(/\0/g, "").replace(/[\u0001-\u001F\u007F]/g, "");
  return cleaned.slice(0, 255) || "file";
}

export function friendlyWikiStorageError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("pattern") || m.includes("invalidkey") || m.includes("invalid key")) {
    return `${message} — Try renaming the file to use only letters, numbers, and .-_ or use a shorter name. If this persists, check Storage → wiki-public allowed MIME types in the Supabase dashboard.`;
  }
  if (m.includes("mime") || m.includes("content-type") || m.includes("invalidmimetype")) {
    return `${message} — The file type could not be accepted. Try a standard PDF export or rename to end in .pdf.`;
  }
  return message;
}
