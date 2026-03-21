"use client";

import { useState, useEffect, useTransition, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

// Lazy-load the markdown renderer so react-markdown + highlight.js are only
// bundled when the editor is actually opened — not on every wiki page load.
const MarkdownRenderer = dynamic(
  () => import("./markdown-renderer-client").then((m) => ({ default: m.MarkdownRenderer })),
  { ssr: false, loading: () => <div style={{ color: "var(--ds-text-muted)", fontSize: 13 }}>Rendering…</div> }
);
import type { WikiPageType, WikiTreeNode } from "../types";
import { WikiResourceAttachmentsEditor } from "./wiki-resource-attachments";

const MONO: React.CSSProperties = {
  fontFamily: "var(--font-dm-mono), monospace",
};

const INPUT_STYLE: React.CSSProperties = {
  ...MONO,
  fontSize: 13,
  width: "100%",
  padding: "8px 12px",
  background: "var(--ds-bg-surface)",
  border: "1px solid var(--ds-border)",
  borderRadius: 6,
  color: "var(--ds-text-primary)",
  outline: "none",
  boxSizing: "border-box",
};

const AUTOSAVE_KEY = (id: string | null) =>
  `wiki-editor-draft-${id ?? "new"}`;

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

type SaveState = "idle" | "saving" | "saved" | "error";

export type WikiEditorProps = {
  /** If editing an existing page, pass its data */
  page?: {
    id: string;
    slug: string;
    title: string;
    description: string;
    body: string | null;
    type: WikiPageType;
    parent_id: string | null;
    status: string;
  };
  /** If proposing an update to a live page, pass the original's id */
  suggestedUpdateOf?: string;
  /** Pre-fill values for a proposal without passing a page (avoids edit-mode) */
  initialValues?: {
    title: string;
    description: string;
    body: string;
    type: WikiPageType;
    parentId: string;
  };
  /** Flat list of tree nodes for parent selector */
  treeNodes: WikiTreeNode[];
  locale: string;
};

export function WikiEditor({ page, suggestedUpdateOf, initialValues, treeNodes, locale }: WikiEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Form state ──────────────────────────────────────────────────────────
  const [title, setTitle] = useState(page?.title ?? initialValues?.title ?? "");
  const [slug, setSlug] = useState(page?.slug ?? "");
  const [description, setDescription] = useState(page?.description ?? initialValues?.description ?? "");
  const [body, setBody] = useState(page?.body ?? initialValues?.body ?? "");
  const [type, setType] = useState<WikiPageType>(page?.type ?? initialValues?.type ?? "guide");
  const [parentId, setParentId] = useState<string>(page?.parent_id ?? initialValues?.parentId ?? "");

  const [previewMode, setPreviewMode] = useState<"edit" | "split" | "preview">("edit");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  // ── Auto-generate slug from title (only on new pages) ───────────────────
  function titleToSlug(t: string) {
    return t
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 80);
  }

  useEffect(() => {
    if (!page) setSlug(titleToSlug(title));
  }, [title, page]);

  // ── Restore autosave on mount ────────────────────────────────────────────
  useEffect(() => {
    const key = AUTOSAVE_KEY(page?.id ?? null);
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const saved = JSON.parse(raw);
        // Only restore if user hasn't typed yet
        if (!page) {
          if (saved.title) setTitle(saved.title);
          if (saved.slug) setSlug(saved.slug);
          if (saved.description) setDescription(saved.description);
          if (saved.body) setBody(saved.body);
          if (saved.type) setType(saved.type);
          if (saved.parentId) setParentId(saved.parentId);
        } else {
          // Editing: restore body only if user hasn't submitted
          if (page.status !== "live" && saved.body) setBody(saved.body);
        }
      }
    } catch {
      /* ignore */
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Autosave to localStorage ─────────────────────────────────────────────
  const triggerAutosave = useCallback(() => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      const key = AUTOSAVE_KEY(page?.id ?? null);
      try {
        localStorage.setItem(
          key,
          JSON.stringify({ title, slug, description, body, type, parentId, savedAt: Date.now() })
        );
        setSaveState("saved");
        setTimeout(() => setSaveState("idle"), 2000);
      } catch {
        setSaveState("error");
      }
    }, 1200);
  }, [title, slug, description, body, type, parentId, page?.id]);

  useEffect(() => {
    if (title || body || description) triggerAutosave();
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, [title, slug, description, body, type, parentId, triggerAutosave]);

  // ── Validation ──────────────────────────────────────────────────────────
  const words = wordCount(body);
  const MIN_WORDS = type === "section" ? 0 : 50;
  const bodyValid = type === "section" || words >= MIN_WORDS;

  // ── Submit / Save draft / Submit for review ──────────────────────────────
  async function handleSubmit(action: "draft" | "review") {
    setSubmitError(null);
    setSaveState("saving");

    const payload = {
      // For proposals: always create new (no id); include suggested_update_of
      id: suggestedUpdateOf ? undefined : page?.id,
      slug,
      title,
      description,
      body: type === "section" ? null : body,
      type,
      parent_id: parentId || null,
      status: action === "draft" ? "draft" : "pending_review",
      ...(suggestedUpdateOf ? { suggested_update_of: suggestedUpdateOf } : {}),
    };

    try {
      const res = await fetch("/api/wiki/upsert-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Save failed");

      // Clear autosave on success
      localStorage.removeItem(AUTOSAVE_KEY(page?.id ?? null));
      setSaveState("saved");

      startTransition(() => {
        router.push(`/${locale}/dashboard/wiki/p/${json.slug}`);
        router.refresh();
      });
    } catch (err) {
      setSaveState("error");
      setSubmitError(err instanceof Error ? err.message : "An error occurred.");
    }
  }

  const saveLabel =
    saveState === "saving"
      ? "Saving…"
      : saveState === "saved"
      ? "Saved ✓"
      : saveState === "error"
      ? "Error"
      : "Auto-saved";

  const isEditing = !!page;

  // Sections cannot have body
  const showBodyEditor = type !== "section";

  // Eligible parents: any live section (exclude self)
  const sectionNodes = treeNodes.filter(
    (n) => n.status === "live" && n.id !== page?.id
  );

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, gap: 12, flexWrap: "wrap" }}>
        <div>
          <p style={{ ...MONO, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ds-text-muted)", marginBottom: 6 }}>
            {suggestedUpdateOf ? "Suggest update" : isEditing ? "Edit page" : "New page"}
          </p>
          <h1 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: 22, fontWeight: 800, color: "var(--ds-text-primary)" }}>
            {isEditing ? page.title || "Untitled" : title || "Untitled"}
          </h1>
        </div>

        {/* Auto-save indicator */}
        <span style={{ ...MONO, fontSize: 11, color: saveState === "error" ? "var(--ds-destructive)" : "var(--ds-text-muted)" }}>
          {saveLabel}
        </span>
      </div>

      {/* Metadata fields */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={{ ...MONO, fontSize: 10, color: "var(--ds-text-muted)", display: "block", marginBottom: 5 }}>
            TITLE *
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Page title"
            style={{ ...INPUT_STYLE, fontSize: 16, fontFamily: "var(--font-syne), sans-serif", fontWeight: 700 }}
          />
        </div>

        <div>
          <label style={{ ...MONO, fontSize: 10, color: "var(--ds-text-muted)", display: "block", marginBottom: 5 }}>
            SLUG *
          </label>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
            placeholder="page-url-slug"
            style={INPUT_STYLE}
          />
        </div>

        <div>
          <label style={{ ...MONO, fontSize: 10, color: "var(--ds-text-muted)", display: "block", marginBottom: 5 }}>
            TYPE *
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as WikiPageType)}
            style={{ ...INPUT_STYLE, cursor: "pointer" }}
          >
            <option value="guide">Guide</option>
            <option value="reference">Reference</option>
            <option value="resource">Resource (body + file attachments)</option>
            <option value="section">Section (container only)</option>
          </select>
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <label style={{ ...MONO, fontSize: 10, color: "var(--ds-text-muted)", display: "block", marginBottom: 5 }}>
            DESCRIPTION (short summary)
          </label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="One sentence about this page…"
            style={INPUT_STYLE}
          />
        </div>

        <div>
          <label style={{ ...MONO, fontSize: 10, color: "var(--ds-text-muted)", display: "block", marginBottom: 5 }}>
            PARENT PAGE
          </label>
          <select
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            style={{ ...INPUT_STYLE, cursor: "pointer" }}
          >
            <option value="">— None (root level) —</option>
            {sectionNodes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Body editor */}
      {showBodyEditor && (
        <div style={{ marginBottom: 24 }}>
          {/* Mode tabs */}
          <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 0, borderBottom: "1px solid var(--ds-border)" }}>
            {(["edit", "split", "preview"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setPreviewMode(mode)}
                style={{
                  ...MONO,
                  fontSize: 11,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  padding: "6px 14px",
                  border: "none",
                  borderBottom: previewMode === mode ? "2px solid var(--ds-accent)" : "2px solid transparent",
                  background: "transparent",
                  color: previewMode === mode ? "var(--ds-text-primary)" : "var(--ds-text-muted)",
                  cursor: "pointer",
                  marginBottom: -1,
                }}
              >
                {mode}
              </button>
            ))}
            <span style={{ ...MONO, fontSize: 11, color: "var(--ds-text-muted)", marginLeft: "auto", paddingRight: 8 }}>
              {words} words {!bodyValid && words < MIN_WORDS && <span style={{ color: "var(--ds-destructive)" }}>(min {MIN_WORDS})</span>}
            </span>
          </div>

          <div style={{ display: "flex", gap: 0, minHeight: 420, border: "1px solid var(--ds-border)", borderTop: "none", borderRadius: "0 0 6px 6px", overflow: "hidden" }}>
            {/* Edit pane */}
            {(previewMode === "edit" || previewMode === "split") && (
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={`Write in Markdown...\n\n## Section\n\nYour content here.`}
                style={{
                  ...MONO,
                  fontSize: 13,
                  flex: 1,
                  padding: "16px",
                  background: "var(--ds-bg-surface)",
                  border: "none",
                  borderRight: previewMode === "split" ? "1px solid var(--ds-border)" : "none",
                  color: "var(--ds-text-secondary)",
                  resize: "none",
                  outline: "none",
                  lineHeight: 1.7,
                  minHeight: 420,
                }}
              />
            )}

            {/* Preview pane */}
            {(previewMode === "preview" || previewMode === "split") && (
              <div
                style={{
                  flex: 1,
                  padding: "16px",
                  overflowY: "auto",
                  background: "var(--ds-bg-base)",
                }}
              >
                {body ? (
                  <MarkdownRenderer body={body} />
                ) : (
                  <p style={{ ...MONO, fontSize: 12, color: "var(--ds-text-muted)" }}>
                    Nothing to preview yet.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {type === "resource" && !suggestedUpdateOf && (
        <>
          {page?.id ? (
            <WikiResourceAttachmentsEditor pageId={page.id} />
          ) : (
            <p style={{ ...MONO, fontSize: 12, color: "var(--ds-text-muted)", marginBottom: 20 }}>
              Save this page as a draft first — then you can attach PDFs, images, and other files for download.
            </p>
          )}
        </>
      )}

      {/* Error */}
      {submitError && (
        <p style={{ ...MONO, fontSize: 12, color: "var(--ds-destructive)", marginBottom: 12 }}>
          {submitError}
        </p>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <button
          onClick={() => handleSubmit("draft")}
          disabled={isPending || !title.trim() || !slug.trim()}
          style={{
            ...MONO,
            fontSize: 12,
            padding: "8px 18px",
            borderRadius: 5,
            border: "1px solid var(--ds-border)",
            background: "transparent",
            color: "var(--ds-text-secondary)",
            cursor: "pointer",
            opacity: !title.trim() ? 0.4 : 1,
          }}
        >
          Save draft
        </button>

        {!confirmSubmit ? (
          <button
            onClick={() => {
              if (!bodyValid) {
                setSubmitError(`Body must be at least ${MIN_WORDS} words.`);
                return;
              }
              setSubmitError(null);
              setConfirmSubmit(true);
            }}
            disabled={isPending || !title.trim() || !slug.trim()}
            style={{
              ...MONO,
              fontSize: 12,
              padding: "8px 18px",
              borderRadius: 5,
              border: "1px solid var(--ds-accent)",
              background: "transparent",
              color: "var(--ds-accent)",
              cursor: "pointer",
              opacity: !title.trim() ? 0.4 : 1,
            }}
          >
            Submit for review →
          </button>
        ) : (
          <>
            <span style={{ ...MONO, fontSize: 12, color: "var(--ds-text-muted)" }}>
              This will send for admin review. Continue?
            </span>
            <button
              onClick={() => {
                setConfirmSubmit(false);
                handleSubmit("review");
              }}
              disabled={isPending}
              style={{
                ...MONO,
                fontSize: 12,
                padding: "8px 18px",
                borderRadius: 5,
                border: "none",
                background: "var(--ds-accent)",
                color: "#000",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              Confirm
            </button>
            <button
              onClick={() => setConfirmSubmit(false)}
              style={{
                ...MONO,
                fontSize: 12,
                padding: "8px 12px",
                borderRadius: 5,
                border: "1px solid var(--ds-border)",
                background: "transparent",
                color: "var(--ds-text-muted)",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}
