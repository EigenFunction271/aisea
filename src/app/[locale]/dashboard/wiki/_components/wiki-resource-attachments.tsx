"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { WikiInlineSpinner } from "./wiki-inline-spinner";
import { Spinner } from "@/components/ui/spinner";

const MONO: React.CSSProperties = {
  fontFamily: "var(--font-dm-mono), monospace",
};

type Row = {
  id: string;
  filename: string;
  storage_path: string;
  file_size_bytes: number;
  mime_type: string;
  uploaded_at: string;
};

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function publicUrl(storagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const path = storagePath.split("/").map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/wiki-public/${path}`;
}

export function WikiResourceAttachmentsEditor({
  pageId,
  disabled = false,
}: {
  pageId: string;
  /** True while parent editor is saving the page (avoid concurrent uploads). */
  disabled?: boolean;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch(`/api/wiki/attachments?page_id=${encodeURIComponent(pageId)}`);
    const json = (await res.json()) as { attachments?: Row[]; error?: string };
    if (!res.ok) {
      const msg = json.error ?? "Failed to load attachments";
      setError(msg);
      setRows([]);
      toast.error("Couldn’t load attachments", { description: msg });
      return;
    }
    setRows(json.attachments ?? []);
  }, [pageId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    load().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const list = e.target.files;
    if (!list?.length) return;
    setError(null);
    setUploading(true);
    try {
      const files = Array.from(list);
      for (const file of files) {
        const fd = new FormData();
        fd.set("page_id", pageId);
        fd.set("file", file);
        const res = await fetch("/api/wiki/attachments", { method: "POST", body: fd });
        const json = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(json.error ?? "Upload failed");
      }
      toast.success(
        files.length === 1 ? `Uploaded “${files[0].name}”` : `Uploaded ${files.length} files`
      );
      await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setError(msg);
      toast.error("Upload failed", { description: msg });
    } finally {
      e.target.value = "";
      setUploading(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Remove this file?")) return;
    setError(null);
    setDeletingId(id);
    try {
      const res = await fetch(`/api/wiki/attachments?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        const msg = json.error ?? "Delete failed";
        setError(msg);
        toast.error("Couldn’t remove file", { description: msg });
        return;
      }
      toast.success("Removed attachment");
      await load();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div
      style={{
        marginBottom: 24,
        padding: "16px",
        border: "1px solid var(--ds-border)",
        borderRadius: 8,
        opacity: disabled ? 0.55 : 1,
        pointerEvents: disabled ? "none" : "auto",
        position: "relative",
      }}
    >
      {disabled && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 2,
            borderRadius: 8,
            background: "color-mix(in srgb, var(--ds-bg-base) 40%, transparent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <WikiInlineSpinner label="Saving page…" />
        </div>
      )}
      <p style={{ ...MONO, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ds-text-muted)", marginBottom: 10 }}>
        Attached files
      </p>
      <p style={{ ...MONO, fontSize: 12, color: "var(--ds-text-muted)", marginBottom: 12, lineHeight: 1.5 }}>
        PDF, images, zip, or text (max 10 MB each). Files are listed on the live page for readers to download.
      </p>

      <label
        style={{
          ...MONO,
          fontSize: 12,
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 14px",
          borderRadius: 5,
          border: "1px solid var(--ds-border)",
          color: "var(--ds-text-secondary)",
          cursor: uploading || disabled ? "not-allowed" : "pointer",
          opacity: uploading || disabled ? 0.6 : 1,
        }}
      >
        {uploading ? <Spinner className="size-3.5 shrink-0 text-[var(--ds-accent)]" aria-hidden /> : null}
        {uploading ? "Uploading…" : "Add files"}
        <input
          type="file"
          multiple
          disabled={uploading || disabled}
          onChange={onFileChange}
          style={{ display: "none" }}
          accept=".pdf,.zip,.png,.jpg,.jpeg,.webp,.gif,.txt,.md,.markdown,application/pdf,application/zip,image/*,text/plain,text/markdown"
        />
      </label>

      {error && (
        <p style={{ ...MONO, fontSize: 12, color: "var(--ds-destructive)", marginTop: 10 }}>
          {error}
        </p>
      )}

      {loading ? (
        <div style={{ marginTop: 14 }}>
          <WikiInlineSpinner label="Loading attachments…" />
        </div>
      ) : rows.length === 0 ? (
        <p style={{ ...MONO, fontSize: 12, color: "var(--ds-text-muted)", marginTop: 12 }}>No files yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: "12px 0 0" }}>
          {rows.map((r) => (
            <li
              key={r.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 0",
                borderBottom: "1px solid var(--ds-border-subtle)",
                ...MONO,
                fontSize: 12,
              }}
            >
              <a
                href={publicUrl(r.storage_path)}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--ds-accent)", textDecoration: "none", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              >
                {r.filename}
              </a>
              <span style={{ color: "var(--ds-text-muted)", flexShrink: 0 }}>{formatBytes(r.file_size_bytes)}</span>
              <button
                type="button"
                onClick={() => remove(r.id)}
                disabled={deletingId !== null}
                style={{
                  ...MONO,
                  fontSize: 11,
                  border: "none",
                  background: "transparent",
                  color: "var(--ds-text-muted)",
                  cursor: deletingId ? "wait" : "pointer",
                  flexShrink: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  minWidth: 72,
                  justifyContent: "flex-end",
                }}
              >
                {deletingId === r.id ? (
                  <Spinner className="size-3 shrink-0 text-[var(--ds-text-muted)]" aria-hidden />
                ) : null}
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
