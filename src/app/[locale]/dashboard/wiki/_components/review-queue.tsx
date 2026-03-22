"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Link } from "@/i18n/routing";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

const MONO: React.CSSProperties = {
  fontFamily: "var(--font-dm-mono), monospace",
};

export type ReviewItem = {
  id: string;
  slug: string;
  title: string;
  type: string;
  status: string;
  updated_at: string;
  author_username: string | null;
  author_name: string | null;
  word_count?: number;
};

type ReviewAction = "approve" | "reject" | "request_changes";

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending_review: "var(--wiki-pending-badge)",
    needs_update: "#fb923c",
    rejected: "var(--wiki-rejected-badge)",
    live: "var(--wiki-approved-badge)",
  };
  const color = colors[status] ?? "var(--ds-text-muted)";
  return (
    <span
      style={{
        ...MONO,
        fontSize: 9,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        padding: "2px 7px",
        borderRadius: 3,
        border: `1px solid ${color}55`,
        color,
        flexShrink: 0,
      }}
    >
      {status.replace("_", " ")}
    </span>
  );
}

function ReviewRow({
  item,
  locale,
}: {
  item: ReviewItem;
  locale: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [action, setAction] = useState<ReviewAction | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!action) return;
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/wiki/review-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page_id: item.id,
          action,
          rejection_note: note || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        const msg = json.error ?? "Failed";
        setError(msg);
        toast.error("Review action failed", { description: msg });
        return;
      }
      toast.success(
        action === "approve"
          ? "Page approved"
          : action === "reject"
            ? "Submission rejected"
            : "Changes requested"
      );
      setDone(true);
      startTransition(() => router.refresh());
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--ds-border)", opacity: 0.4 }}>
        <span style={{ ...MONO, fontSize: 12, color: "var(--ds-text-muted)" }}>
          ✓ {item.title} — decision recorded
        </span>
      </div>
    );
  }

  return (
    <div style={{ borderBottom: "1px solid var(--ds-border)" }}>
      {/* Row header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", flexWrap: "wrap" }}>
        <StatusBadge status={item.status} />
        <span style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: 15, fontWeight: 700, color: "var(--ds-text-primary)", flex: 1, minWidth: 0 }}>
          {item.title}
        </span>
        <span style={{ ...MONO, fontSize: 11, color: "var(--ds-text-muted)", flexShrink: 0 }}>
          {item.author_username ? `@${item.author_username}` : "—"}
          {"  "}
          {new Date(item.updated_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
        </span>
        <Link
          href={`/dashboard/wiki/p/${item.slug}` as Parameters<typeof Link>[0]["href"]}
          locale={locale as "en" | "id" | "zh" | "vi"}
          style={{ ...MONO, fontSize: 11, color: "var(--ds-accent)", textDecoration: "none" }}
          target="_blank"
          rel="noopener noreferrer"
        >
          Preview ↗
        </Link>
      </div>

      {/* Action picker */}
      <div style={{ display: "flex", gap: 8, padding: "0 16px 12px", flexWrap: "wrap", alignItems: "center" }}>
        {(["approve", "request_changes", "reject"] as ReviewAction[]).map((a) => (
          <button
            key={a}
            type="button"
            disabled={submitting}
            onClick={() => setAction(action === a ? null : a)}
            style={{
              ...MONO,
              fontSize: 11,
              padding: "5px 12px",
              borderRadius: 4,
              border: `1px solid ${action === a ? "var(--ds-accent)" : "var(--ds-border)"}`,
              background: action === a ? "var(--ds-accent)22" : "transparent",
              color: action === a ? "var(--ds-accent)" : "var(--ds-text-muted)",
              cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? 0.5 : 1,
            }}
          >
            {a.replace("_", " ")}
          </button>
        ))}

        {/* Note input for reject / request_changes */}
        {(action === "reject" || action === "request_changes") && (
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note for the author (optional)"
            disabled={submitting}
            style={{
              ...MONO,
              fontSize: 12,
              flex: 1,
              minWidth: 200,
              padding: "5px 10px",
              background: "var(--ds-bg-surface)",
              border: "1px solid var(--ds-border)",
              borderRadius: 4,
              color: "var(--ds-text-secondary)",
              outline: "none",
              opacity: submitting ? 0.6 : 1,
            }}
          />
        )}

        {action && (
          <button
            type="button"
            onClick={submit}
            disabled={submitting || isPending}
            style={{
              ...MONO,
              fontSize: 11,
              padding: "5px 14px",
              borderRadius: 4,
              border: "none",
              background: action === "approve" ? "var(--wiki-approved-badge)" : action === "reject" ? "var(--wiki-rejected-badge)" : "var(--wiki-pending-badge)",
              color: "#000",
              cursor: submitting ? "wait" : "pointer",
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              opacity: submitting ? 0.9 : 1,
            }}
          >
            {submitting ? (
              <>
                <Spinner className="size-3 shrink-0 text-[var(--ds-text-primary)]" aria-hidden />
                Sending…
              </>
            ) : (
              "Confirm"
            )}
          </button>
        )}

        {error && <span style={{ ...MONO, fontSize: 11, color: "var(--ds-destructive)" }}>{error}</span>}
      </div>
    </div>
  );
}

export function ReviewQueue({
  items,
  locale,
}: {
  items: ReviewItem[];
  locale: string;
}) {
  if (items.length === 0) {
    return (
      <p style={{ ...MONO, fontSize: 13, color: "var(--ds-text-muted)", padding: "24px 0" }}>
        No pages awaiting review. 
      </p>
    );
  }

  return (
    <div style={{ border: "1px solid var(--ds-border)", borderRadius: 8, overflow: "hidden" }}>
      {items.map((item) => (
        <ReviewRow key={item.id} item={item} locale={locale} />
      ))}
    </div>
  );
}
