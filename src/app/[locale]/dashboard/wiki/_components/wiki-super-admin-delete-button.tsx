"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const MONO: React.CSSProperties = {
  fontFamily: "var(--font-dm-mono), monospace",
};

type Props = {
  pageId: string;
  title: string;
  /** True if this page has children in the tree (sections or nested pages). */
  hasChildren: boolean;
  locale: string;
  /** After successful delete, navigate here (default: wiki home). */
  redirectTo?: string;
};

export function WikiSuperAdminDeleteButton({
  pageId,
  title,
  hasChildren,
  locale,
  redirectTo,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onClick() {
    setErr(null);
    const short = title.length > 48 ? `${title.slice(0, 48)}…` : title;

    let cascade = false;
    if (hasChildren) {
      const ok = window.confirm(
        `Delete “${short}” and ALL pages or sections under it? This cannot be undone.`
      );
      if (!ok) return;
      cascade = true;
    } else {
      const ok = window.confirm(`Delete “${short}”? This cannot be undone.`);
      if (!ok) return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/wiki/delete-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page_id: pageId, cascade }),
      });
      const json = (await res.json()) as { error?: string; childCount?: number };
      if (!res.ok) {
        if (res.status === 409 && json.childCount) {
          setErr(`Has ${json.childCount} child page(s). Use delete again and confirm to remove the whole branch.`);
        } else {
          setErr(json.error ?? "Delete failed");
        }
        return;
      }
      const dest = redirectTo ?? `/${locale}/dashboard/wiki`;
      router.push(dest);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        style={{
          ...MONO,
          fontSize: 11,
          padding: "3px 10px",
          borderRadius: 4,
          border: "1px solid color-mix(in srgb, var(--ds-error, #f87171) 60%, transparent)",
          background: "transparent",
          color: "var(--ds-error, #f87171)",
          cursor: busy ? "wait" : "pointer",
          opacity: busy ? 0.6 : 1,
        }}
      >
        {busy ? "Deleting…" : "Delete"}
      </button>
      {err && (
        <span style={{ ...MONO, fontSize: 10, color: "var(--ds-error, #f87171)", maxWidth: 220, textAlign: "right" }}>
          {err}
        </span>
      )}
    </span>
  );
}
