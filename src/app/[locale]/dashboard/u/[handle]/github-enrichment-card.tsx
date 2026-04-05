"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const MONO: React.CSSProperties = {
  fontFamily: "var(--font-dm-mono), monospace",
};

const POLL_INITIAL_MS = 3500;
const POLL_MAX_MS = 14000;
const POLL_BACKOFF_FACTOR = 1.35;
const MAX_POLLS = 36;

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
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastKnownAt = useRef<string | null>(initialEnrichedAt);
  const pollCountRef = useRef(0);
  const delayRef = useRef(POLL_INITIAL_MS);

  const showToast = (kind: Toast["kind"], message: string) => {
    setToast({ kind, message });
    setTimeout(() => setToast(null), 4000);
  };

  const stopPolling = useCallback(() => {
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
    pollCountRef.current = 0;
    delayRef.current = POLL_INITIAL_MS;
  }, []);

  const scheduleNextPoll = useCallback(
    (run: () => void) => {
      const d = delayRef.current;
      pollTimeoutRef.current = setTimeout(run, d);
      delayRef.current = Math.min(
        POLL_MAX_MS,
        Math.round(d * POLL_BACKOFF_FACTOR)
      );
    },
    []
  );

  const startPolling = useCallback(() => {
    stopPolling();
    pollCountRef.current = 0;
    delayRef.current = POLL_INITIAL_MS;

    const tick = async () => {
      pollTimeoutRef.current = null;
      pollCountRef.current += 1;
      if (pollCountRef.current > MAX_POLLS) {
        stopPolling();
        setIsRunning(false);
        showToast(
          "error",
          "Enrichment is taking longer than expected — refresh the page in a minute or try again."
        );
        return;
      }
      try {
        const res = await fetch(
          `/api/builders/enrich-status?builder_id=${encodeURIComponent(builderId)}`
        );
        if (!res.ok) {
          scheduleNextPoll(tick);
          return;
        }
        const data: { github_enriched_at: string | null } = await res.json();
        const newAt = data.github_enriched_at;
        if (newAt && newAt !== lastKnownAt.current) {
          lastKnownAt.current = newAt;
          setEnrichedAt(newAt);
          setIsRunning(false);
          stopPolling();
          showToast("success", "Profile enriched — tags updated.");
          window.location.reload();
          return;
        }
      } catch {
        // next backoff poll
      }
      scheduleNextPoll(tick);
    };

    scheduleNextPoll(tick);
  }, [builderId, stopPolling, scheduleNextPoll]);

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

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

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
