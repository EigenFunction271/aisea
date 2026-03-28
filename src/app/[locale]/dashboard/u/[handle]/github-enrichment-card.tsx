"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const MONO: React.CSSProperties = {
  fontFamily: "var(--font-dm-mono), monospace",
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

type Toast = { kind: "success" | "error"; message: string };

export function GitHubEnrichmentCard({
  builderId,
  githubHandle,
  initialEnrichedAt,
}: {
  builderId: string;
  githubHandle: string | null;
  initialEnrichedAt: string | null;
}) {
  const [enrichedAt, setEnrichedAt] = useState<string | null>(initialEnrichedAt);
  const [isRunning, setIsRunning] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastKnownAt = useRef<string | null>(initialEnrichedAt);

  const showToast = (kind: Toast["kind"], message: string) => {
    setToast({ kind, message });
    setTimeout(() => setToast(null), 4000);
  };

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/builders/enrich-status?builder_id=${encodeURIComponent(builderId)}`
        );
        if (!res.ok) return;
        const data: { github_enriched_at: string | null } = await res.json();
        const newAt = data.github_enriched_at;
        if (newAt && newAt !== lastKnownAt.current) {
          lastKnownAt.current = newAt;
          setEnrichedAt(newAt);
          setIsRunning(false);
          stopPolling();
          showToast("success", "Profile enriched — tags updated.");
          // Refresh the page to show new tags without a full reload
          window.location.reload();
        }
      } catch {
        // silent — next poll will retry
      }
    }, 3000);
  }, [builderId, stopPolling]);

  // Clean up on unmount
  useEffect(() => () => stopPolling(), [stopPolling]);

  async function handleEnrich() {
    if (isRunning || !githubHandle) return;
    setIsRunning(true);
    try {
      const res = await fetch("/api/builders/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ builder_id: builderId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      startPolling();
    } catch (err) {
      setIsRunning(false);
      showToast("error", err instanceof Error ? err.message : "Enrichment failed — try again.");
    }
  }

  return (
    <div
      style={{
        border: "1px solid var(--ds-border)",
        borderRadius: 8,
        background: "var(--ds-bg-surface)",
        padding: "14px 18px",
        marginBottom: 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        flexWrap: "wrap",
      }}
    >
      {/* Left: label + status */}
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <span
          style={{
            ...MONO,
            fontSize: 10,
            letterSpacing: "0.10em",
            textTransform: "uppercase",
            color: "var(--ds-text-muted)",
          }}
        >
          GitHub enrichment
        </span>
        <span style={{ ...MONO, fontSize: 12, color: "var(--ds-text-secondary)" }}>
          {isRunning
            ? "Enriching your profile…"
            : enrichedAt
            ? `Last enriched: ${relativeTime(enrichedAt)}`
            : githubHandle
            ? "GitHub profile not yet enriched."
            : "Add a GitHub handle to enable enrichment."}
        </span>
      </div>

      {/* Right: button */}
      {githubHandle ? (
        <button
          onClick={handleEnrich}
          disabled={isRunning}
          style={{
            ...MONO,
            fontSize: 11,
            letterSpacing: "0.08em",
            padding: "7px 14px",
            borderRadius: 5,
            border: "1px solid var(--ds-border)",
            background: isRunning ? "transparent" : "var(--ds-accent)",
            color: isRunning ? "var(--ds-text-muted)" : "#0a0a0a",
            cursor: isRunning ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: 7,
            transition: "opacity 0.15s",
            flexShrink: 0,
          }}
        >
          {isRunning && (
            <span
              style={{
                display: "inline-block",
                width: 10,
                height: 10,
                border: "2px solid var(--ds-text-muted)",
                borderTopColor: "transparent",
                borderRadius: "50%",
                animation: "spin 0.7s linear infinite",
              }}
            />
          )}
          {isRunning ? "Running…" : "Enrich from GitHub"}
        </button>
      ) : (
        <a
          href="edit-profile"
          style={{
            ...MONO,
            fontSize: 11,
            letterSpacing: "0.08em",
            padding: "7px 14px",
            borderRadius: 5,
            border: "1px solid var(--ds-border)",
            color: "var(--ds-text-muted)",
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          Add GitHub handle →
        </a>
      )}

      {/* Inline spinner keyframe — injected once */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 9999,
            ...MONO,
            fontSize: 12,
            padding: "10px 16px",
            borderRadius: 6,
            background: toast.kind === "success" ? "#052e16" : "#2d0a0a",
            border: `1px solid ${toast.kind === "success" ? "#166534" : "#7f1d1d"}`,
            color: toast.kind === "success" ? "#4ade80" : "#f87171",
            boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
            maxWidth: 320,
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
