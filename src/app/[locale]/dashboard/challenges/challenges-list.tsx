"use client";

import { useMemo, useState, useTransition } from "react";
import { Link } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/client";
import { enrollInChallenge } from "@/lib/challenges/edge-functions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ChallengeCard, UserChallengeAccess } from "./types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysLeft(endAt: string): number {
  return Math.ceil((new Date(endAt).getTime() - Date.now()) / 86_400_000);
}

type BadgeVariant = "live" | "upcoming" | "closed" | "submitted";

function getStatusBadge(
  challenge: ChallengeCard,
  state: ChallengeCard["enrollment_state"]
): { label: string; variant: BadgeVariant } {
  const now = Date.now();
  if (state === "submitted") return { label: "YOU SUBMITTED", variant: "submitted" };
  if (challenge.status === "archived" || new Date(challenge.end_at).getTime() <= now)
    return { label: "CLOSED", variant: "closed" };
  if (new Date(challenge.start_at).getTime() > now)
    return { label: "UPCOMING", variant: "upcoming" };
  return { label: "LIVE", variant: "live" };
}

const BADGE_STYLES: Record<BadgeVariant, React.CSSProperties> = {
  live: {
    background: "var(--ds-accent)",
    color: "#0a0a0a",
    border: "none",
  },
  upcoming: {
    background: "transparent",
    color: "var(--ds-text-muted)",
    border: "1px solid var(--ds-border)",
  },
  closed: {
    background: "var(--ds-bg-raised)",
    color: "var(--ds-text-muted)",
    border: "1px solid var(--ds-border-subtle)",
  },
  submitted: {
    background: "transparent",
    color: "var(--ds-accent)",
    border: "1px solid var(--ds-accent)",
  },
};

const BADGE_BASE: React.CSSProperties = {
  fontFamily: "var(--font-dm-mono), monospace",
  fontSize: 10,
  fontWeight: 500,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  padding: "3px 8px",
  borderRadius: 4,
  display: "inline-block",
};

// ── Challenge card ────────────────────────────────────────────────────────────

function ChallengeCardItem({
  challenge,
  locked,
  locale,
  isEnrolling,
  onEnroll,
}: {
  challenge: ChallengeCard;
  locked: boolean;
  locale: string;
  isEnrolling: boolean;
  onEnroll: (id: string) => void;
}) {
  const { label, variant } = getStatusBadge(challenge, challenge.enrollment_state);
  const remaining = daysLeft(challenge.end_at);
  const isLive = variant === "live";
  const visibleTags = challenge.tags.slice(0, 2);

  // CTA config
  let ctaLabel = "";
  let ctaHref: string | null = null;
  let ctaAction: (() => void) | null = null;
  let ctaStyle: React.CSSProperties = {};

  if (locked) {
    ctaHref = `/${locale}/login?next=/${locale}/dashboard/challenges`;
    ctaLabel = "Sign in →";
    ctaStyle = { background: "var(--ds-accent)", color: "#0a0a0a", border: "none" };
  } else if (challenge.enrollment_state === "submitted") {
    ctaHref = `/dashboard/challenges/${challenge.id}`;
    ctaLabel = "View Submission";
    ctaStyle = { background: "transparent", color: "var(--ds-text-secondary)", border: "1px solid var(--ds-border)" };
  } else if (challenge.enrollment_state === "enrolled" && isLive) {
    ctaHref = `/dashboard/challenges/${challenge.id}`;
    ctaLabel = "Continue →";
    ctaStyle = { background: "transparent", color: "var(--ds-text-primary)", border: "1px solid var(--ds-border)" };
  } else if (challenge.enrollment_state === "not_enrolled" && isLive) {
    ctaAction = () => onEnroll(challenge.id);
    ctaLabel = isEnrolling ? "Joining…" : "Take the Challenge →";
    ctaStyle = { background: "var(--ds-accent)", color: "#0a0a0a", border: "none" };
  }

  const btnBase: React.CSSProperties = {
    fontFamily: "var(--font-dm-mono), monospace",
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: "0.04em",
    padding: "10px 14px",
    borderRadius: 4,
    cursor: ctaAction || ctaHref ? "pointer" : "default",
    opacity: isEnrolling ? 0.6 : 1,
    width: "100%",
    boxSizing: "border-box",
    textAlign: "center",
  };

  return (
    <div
      style={{
        border: "1px solid var(--ds-border)",
        background: "var(--ds-bg-surface)",
        borderRadius: 6,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 0,
        transition: "border-color 0.15s",
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = "#333333")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = "var(--ds-border)")}
    >
      {/* Status + days left */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ ...BADGE_BASE, ...BADGE_STYLES[variant] }}>{label}</span>
        {remaining > 0 && variant !== "closed" && variant !== "upcoming" && (
          <span
            style={{
              fontFamily: "var(--font-dm-mono), monospace",
              fontSize: 11,
              color: "var(--ds-text-muted)",
            }}
          >
            {remaining}d left
          </span>
        )}
      </div>

      {/* Title */}
      <h3
        style={{
          fontFamily: "var(--font-syne), sans-serif",
          fontSize: 18,
          fontWeight: 700,
          color: "var(--ds-text-primary)",
          marginTop: 14,
          lineHeight: 1.3,
          filter: locked ? "blur(4px)" : "none",
          userSelect: locked ? "none" : "auto",
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
        }}
      >
        {challenge.title}
      </h3>

      {/* Subtitle */}
      <p
        style={{
          fontSize: 14,
          color: "var(--ds-text-secondary)",
          marginTop: 6,
          lineHeight: 1.5,
          filter: locked ? "blur(4px)" : "none",
          userSelect: locked ? "none" : "auto",
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
        }}
      >
        {challenge.subtitle}
      </p>

      {/* Tags + difficulty */}
      {(visibleTags.length > 0 || challenge.difficulty) && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
          {visibleTags.map((tag) => (
            <span
              key={tag}
              style={{
                fontFamily: "var(--font-dm-mono), monospace",
                fontSize: 10,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--ds-text-muted)",
                border: "1px solid var(--ds-border)",
                borderRadius: 4,
                padding: "2px 7px",
              }}
            >
              {tag}
            </span>
          ))}
          {challenge.difficulty && (
            <span
              style={{
                fontFamily: "var(--font-dm-mono), monospace",
                fontSize: 10,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color:
                  challenge.difficulty === "hardcore"
                    ? "#f87171"
                    : challenge.difficulty === "builder"
                      ? "#fb923c"
                      : "#4ade80",
                border: `1px solid ${
                  challenge.difficulty === "hardcore"
                    ? "rgba(248,113,113,0.35)"
                    : challenge.difficulty === "builder"
                      ? "rgba(251,146,60,0.35)"
                      : "rgba(74,222,128,0.35)"
                }`,
                borderRadius: 4,
                padding: "2px 7px",
              }}
            >
              {challenge.difficulty}
            </span>
          )}
        </div>
      )}

      {/* Builder count + full-width CTA */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          gap: 10,
          marginTop: 16,
          width: "100%",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-dm-mono), monospace",
            fontSize: 11,
            color: "var(--ds-text-muted)",
          }}
        >
          {challenge.enrollment_count} builder{challenge.enrollment_count !== 1 ? "s" : ""}
        </span>

        {ctaLabel && (
          ctaHref ? (
            <Link
              href={ctaHref as Parameters<typeof Link>[0]["href"]}
              style={{ display: "block", width: "100%" }}
            >
              <button type="button" style={{ ...btnBase, ...ctaStyle }}>
                {ctaLabel}
              </button>
            </Link>
          ) : (
            <button
              type="button"
              style={{ ...btnBase, ...ctaStyle }}
              onClick={ctaAction ?? undefined}
              disabled={isEnrolling}
            >
              {ctaLabel}
            </button>
          )
        )}
      </div>
    </div>
  );
}

// ── Main list ─────────────────────────────────────────────────────────────────

function canInteract(access: UserChallengeAccess) {
  return access.isAuthenticated && access.isProfileComplete;
}

export function ChallengesList({
  active,
  archived,
  access,
  locale,
}: {
  active: ChallengeCard[];
  archived: ChallengeCard[];
  access: UserChallengeAccess;
  locale: string;
}) {
  const [, startTransition] = useTransition();
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());

  const locked = !canInteract(access);

  const allActive = useMemo(
    () =>
      active.map((c) => ({
        ...c,
        enrollment_state:
          enrolledIds.has(c.id) && c.enrollment_state === "not_enrolled"
            ? ("enrolled" as const)
            : c.enrollment_state,
      })),
    [active, enrolledIds]
  );

  function handleEnroll(challengeId: string) {
    setEnrollError(null);
    setEnrollingId(challengeId);
    startTransition(async () => {
      try {
        const supabase = createClient();
        await enrollInChallenge(supabase, challengeId);
        setEnrolledIds((prev) => new Set(prev).add(challengeId));
      } catch (err) {
        setEnrollError(err instanceof Error ? err.message : "Failed to enroll");
      } finally {
        setEnrollingId(null);
      }
    });
  }

  const tabTriggerBase =
    "rounded px-4 py-1.5 text-[11px] tracking-widest uppercase transition-colors data-[state=active]:text-black";

  return (
    <div style={{ marginTop: 32 }}>
      {/* Admin shortcut */}
      {access.isAdmin && (
        <div style={{ marginBottom: 20 }}>
          <Link href="/dashboard/challenges/admin">
            <button
              style={{
                fontFamily: "var(--font-dm-mono), monospace",
                fontSize: 11,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                padding: "6px 16px",
                borderRadius: 4,
                border: "1px solid var(--ds-border)",
                background: "transparent",
                color: "var(--ds-text-secondary)",
                cursor: "pointer",
              }}
            >
              Admin console →
            </button>
          </Link>
        </div>
      )}

      <Tabs defaultValue="active">
        <TabsList
          style={{
            background: "var(--ds-bg-surface)",
            border: "1px solid var(--ds-border)",
            borderRadius: 6,
            padding: "3px",
            height: "auto",
            gap: 2,
          }}
        >
          <TabsTrigger
            value="active"
            className={tabTriggerBase}
            style={{ fontFamily: "var(--font-dm-mono), monospace" }}
          >
            Active
          </TabsTrigger>
          <TabsTrigger
            value="archived"
            className={tabTriggerBase}
            style={{ fontFamily: "var(--font-dm-mono), monospace" }}
          >
            Archived
          </TabsTrigger>
        </TabsList>

        {/* Active tab */}
        <TabsContent value="active" style={{ marginTop: 20 }}>
          {allActive.length === 0 ? (
            <p style={{ fontSize: 14, color: "var(--ds-text-muted)" }}>
              No active challenges yet — check back soon.
            </p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 16,
              }}
            >
              {allActive.map((challenge) => (
                <ChallengeCardItem
                  key={challenge.id}
                  challenge={challenge}
                  locked={locked}
                  locale={locale}
                  isEnrolling={enrollingId === challenge.id}
                  onEnroll={handleEnroll}
                />
              ))}
            </div>
          )}
          {enrollError && (
            <p style={{ marginTop: 12, fontSize: 13, color: "var(--ds-destructive)" }}>{enrollError}</p>
          )}
        </TabsContent>

        {/* Archived tab */}
        <TabsContent value="archived" style={{ marginTop: 20 }}>
          {archived.length === 0 ? (
            <p style={{ fontSize: 14, color: "var(--ds-text-muted)" }}>
              No archived challenges yet.
            </p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 16,
              }}
            >
              {archived.map((challenge) => (
                <ChallengeCardItem
                  key={challenge.id}
                  challenge={challenge}
                  locked={locked}
                  locale={locale}
                  isEnrolling={false}
                  onEnroll={() => {}}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Lock banner */}
      {locked && (
        <div
          style={{
            marginTop: 24,
            border: "1px solid var(--ds-border)",
            background: "var(--ds-bg-surface)",
            borderRadius: 6,
            padding: 20,
          }}
        >
          <p style={{ fontSize: 14, color: "var(--ds-text-secondary)", lineHeight: 1.6 }}>
            Challenge content is locked.{" "}
            {access.isAuthenticated
              ? "Complete your profile (bio, username, name, country) to enroll and submit."
              : "Sign in and complete your profile to enroll and submit."}
          </p>
          <Link
            href={
              access.isAuthenticated
                ? "/dashboard/create-profile"
                : `/${locale}/login?next=/${locale}/dashboard/challenges`
            }
          >
            <button
              style={{
                marginTop: 14,
                fontFamily: "var(--font-dm-mono), monospace",
                fontSize: 11,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                padding: "7px 16px",
                borderRadius: 4,
                background: "var(--ds-accent)",
                color: "#0a0a0a",
                border: "none",
                cursor: "pointer",
              }}
            >
              {access.isAuthenticated ? "Complete profile →" : "Sign in →"}
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}
