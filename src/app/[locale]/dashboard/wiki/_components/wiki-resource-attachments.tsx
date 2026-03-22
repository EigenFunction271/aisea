"use client";

import { useCallback, useEffect, useState } from "react";

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

export function WikiResourceAttachmentsEditor({ pageId }: { pageId: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch(`/api/wiki/attachments?page_id=${encodeURIComponent(pageId)}`);
    const json = (await res.json()) as { attachments?: Row[]; error?: string };
    if (!res.ok) {
      setError(json.error ?? "Failed to load attachments");
      setRows([]);
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
      for (const file of Array.from(list)) {
        const fd = new FormData();
        fd.set("page_id", pageId);
        fd.set("file", file);
        const res = await fetch("/api/wiki/attachments", { method: "POST", body: fd });
        const json = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(json.error ?? "Upload failed");
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      e.target.value = "";
      setUploading(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Remove this file?")) return;
    setError(null);
    const res = await fetch(`/api/wiki/attachments?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(json.error ?? "Delete failed");
      return;
    }
    await load();
  }

  return (
    <div style={{ marginBottom: 24, padding: "16px", border: "1px solid var(--ds-border)", borderRadius: 8 }}>
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
          display: "inline-block",
          padding: "6px 14px",
          borderRadius: 5,
          border: "1px solid var(--ds-border)",
          color: "var(--ds-text-secondary)",
          cursor: uploading ? "wait" : "pointer",
          opacity: uploading ? 0.6 : 1,
        }}
      >
        {uploading ? "Uploading…" : "Add files"}
        <input
          type="file"
          multiple
          disabled={uploading}
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
        <p style={{ ...MONO, fontSize: 12, color: "var(--ds-text-muted)", marginTop: 12 }}>Loading…</p>
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
                style={{
                  ...MONO,
                  fontSize: 11,
                  border: "none",
                  background: "transparent",
                  color: "var(--ds-text-muted)",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
