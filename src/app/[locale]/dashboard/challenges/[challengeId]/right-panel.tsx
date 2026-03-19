"use client";

import { useState, useEffect, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { enrollInChallenge } from "@/lib/challenges/edge-functions";

type Props = {
  challengeId: string;
  endAt: string;
  participantCount: number;
  isLocked: boolean;
  isEnrolled: boolean;
  hasSubmission: boolean;
  canSubmit: boolean;
  locale: string;
};

function formatCountdown(endAt: string): { text: string; urgent: boolean } {
  const ms = new Date(endAt).getTime() - Date.now();
  if (ms <= 0) return { text: "Closed", urgent: false };
  const totalMinutes = Math.floor(ms / 60_000);
  const totalHours = Math.floor(ms / 3_600_000);
  if (totalHours < 48) {
    const h = totalHours;
    const m = totalMinutes % 60;
    return { text: `${h}h ${m}m`, urgent: true };
  }
  const days = Math.ceil(ms / 86_400_000);
  return { text: `${days} days`, urgent: false };
}

const MONO: React.CSSProperties = {
  fontFamily: "var(--font-dm-mono), monospace",
};

const SECTION_LABEL: React.CSSProperties = {
  ...MONO,
  fontSize: 10,
  letterSpacing: "0.10em",
  textTransform: "uppercase" as const,
  color: "var(--ds-text-muted)",
  marginBottom: 6,
};

export function RightPanel({
  challengeId,
  endAt,
  participantCount,
  isLocked,
  isEnrolled,
  hasSubmission,
  canSubmit,
  locale,
}: Props) {
  const [countdown, setCountdown] = useState(() => formatCountdown(endAt));
  const [enrolledLocal, setEnrolledLocal] = useState(isEnrolled);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setCountdown(formatCountdown(endAt)), 30_000);
    return () => clearInterval(id);
  }, [endAt]);

  function handleEnroll() {
    setEnrollError(null);
    startTransition(async () => {
      try {
        const supabase = createClient();
        await enrollInChallenge(supabase, challengeId);
        setEnrolledLocal(true);
      } catch (e) {
        setEnrollError(e instanceof Error ? e.message : "Failed to enroll");
      }
    });
  }

  function handleShare() {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(window.location.href).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }

  const isClosed = countdown.text === "Closed";

  const btnBase: React.CSSProperties = {
    ...MONO,
    fontSize: 12,
    fontWeight: 500,
    letterSpacing: "0.04em",
    padding: "9px 18px",
    borderRadius: 5,
    cursor: "pointer",
    width: "100%",
    textAlign: "center" as const,
    display: "block",
    transition: "opacity 0.15s",
  };

  // CTA render
  let cta: React.ReactNode = null;
  if (isLocked) {
    cta = (
      <a
        href={`/${locale}/login?next=/${locale}/dashboard/challenges/${challengeId}`}
        style={{ ...btnBase, background: "var(--ds-accent)", color: "#0a0a0a", border: "none" }}
      >
        Sign in to join →
      </a>
    );
  } else if (isClosed || !canSubmit) {
    if (hasSubmission || enrolledLocal) {
      cta = (
        <a
          href="#submission"
          style={{
            ...btnBase,
            background: "transparent",
            color: "var(--ds-text-secondary)",
            border: "1px solid var(--ds-border)",
          }}
        >
          View Submission
        </a>
      );
    } else {
      cta = (
        <span
          style={{
            ...btnBase,
            background: "transparent",
            color: "var(--ds-text-muted)",
            border: "1px solid var(--ds-border)",
            cursor: "default",
          }}
        >
          Submissions Closed
        </span>
      );
    }
  } else if (hasSubmission) {
    cta = (
      <a
        href="#submission"
        style={{
          ...btnBase,
          background: "transparent",
          color: "var(--ds-text-secondary)",
          border: "1px solid var(--ds-border)",
        }}
      >
        Edit Submission →
      </a>
    );
  } else if (enrolledLocal) {
    cta = (
      <a
        href="#submission"
        style={{ ...btnBase, background: "var(--ds-accent)", color: "#0a0a0a", border: "none" }}
      >
        Submit Now →
      </a>
    );
  } else {
    cta = (
      <button
        onClick={handleEnroll}
        disabled={isPending}
        style={{
          ...btnBase,
          background: "var(--ds-accent)", color: "#0a0a0a", border: "none",
          opacity: isPending ? 0.6 : 1,
        }}
      >
        {isPending ? "Joining…" : "Take the Challenge →"}
      </button>
    );
  }

  return (
    <aside
      style={{
        position: "sticky",
        top: 80,
        border: "1px solid var(--ds-border)",
        borderRadius: 8,
        background: "var(--ds-bg-surface)",
        padding: "20px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      {/* Countdown */}
      <div>
        <p style={SECTION_LABEL}>Time remaining</p>
        <p
          style={{
            ...MONO,
            fontSize: 26,
            fontWeight: 700,
            color: countdown.urgent ? "#f87171" : "var(--ds-text-primary)",
            lineHeight: 1.1,
          }}
        >
          {countdown.text}
        </p>
      </div>

      {/* Participants */}
      <div>
        <p style={SECTION_LABEL}>Builders enrolled</p>
        <p
          style={{
            ...MONO,
            fontSize: 20,
            fontWeight: 600,
            color: "var(--ds-text-primary)",
          }}
        >
          {participantCount}
        </p>
      </div>

      {/* CTA */}
      <div>{cta}</div>

      {enrollError && (
        <p style={{ ...MONO, fontSize: 11, color: "#f87171" }}>{enrollError}</p>
      )}

      {/* Share */}
      <button
        onClick={handleShare}
        style={{
          ...MONO,
          fontSize: 11,
          letterSpacing: "0.06em",
          color: "var(--ds-text-muted)",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: 0,
          textAlign: "left" as const,
        }}
      >
        {copied ? "✓ Link copied" : "Share challenge ↗"}
      </button>
    </aside>
  );
}
