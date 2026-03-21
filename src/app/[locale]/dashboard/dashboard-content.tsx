"use client";

import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import type { LiveChallenge, ActivityItem } from "./dashboard-types";

// ── Helpers ──────────────────────────────────────────────────────────────────

const CITY_COLORS: Record<string, string> = {
  "kuala lumpur": "var(--ds-city-kl)",
  kl: "var(--ds-city-kl)",
  singapore: "var(--ds-city-sg)",
  jakarta: "var(--ds-city-jkt)",
  manila: "var(--ds-city-mnl)",
  "ho chi minh": "var(--ds-city-hcmc)",
  hcmc: "var(--ds-city-hcmc)",
  bangkok: "var(--ds-city-bkk)",
};

function cityColor(city: string | null): string {
  if (!city) return "var(--ds-city-other)";
  const key = city.toLowerCase();
  for (const [k, v] of Object.entries(CITY_COLORS)) {
    if (key.includes(k)) return v;
  }
  return "var(--ds-city-other)";
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatMemberSince(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function daysLeft(endAt: string): number {
  return Math.ceil((new Date(endAt).getTime() - Date.now()) / 86_400_000);
}

function relativeTime(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "1d ago";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ChallengeStripCard({ challenge }: { challenge: LiveChallenge }) {
  const remaining = daysLeft(challenge.end_at);

  const ctaLabel =
    challenge.enrollment_state === "submitted"
      ? "View Submission"
      : challenge.enrollment_state === "enrolled"
      ? "Continue →"
      : "Take the Challenge →";

  const ctaStyle =
    challenge.enrollment_state === "submitted"
      ? { background: "transparent", border: "1px solid var(--ds-border)", color: "var(--ds-text-secondary)" }
      : challenge.enrollment_state === "enrolled"
      ? { background: "transparent", border: "1px solid var(--ds-border)", color: "var(--ds-text-primary)" }
      : { background: "var(--ds-accent)", border: "none", color: "#0a0a0a" };

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
      }}
    >
      {/* Status + days left */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          style={{
            background: "var(--ds-accent)",
            color: "#0a0a0a",
            padding: "2px 8px",
            borderRadius: 4,
            fontSize: 11,
            fontFamily: "var(--font-dm-mono), monospace",
            fontWeight: 500,
            letterSpacing: "0.08em",
          }}
        >
          LIVE
        </span>
        {remaining > 0 && (
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
          marginTop: 12,
          lineHeight: 1.3,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
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
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {challenge.subtitle}
      </p>

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
        <Link
          href={`/dashboard/challenges/${challenge.id}`}
          style={{ display: "block", width: "100%" }}
        >
          <button
            type="button"
            style={{
              ...ctaStyle,
              width: "100%",
              boxSizing: "border-box",
              padding: "10px 14px",
              borderRadius: 4,
              fontSize: 12,
              fontFamily: "var(--font-dm-mono), monospace",
              fontWeight: 500,
              cursor: "pointer",
              letterSpacing: "0.02em",
              textAlign: "center",
            }}
          >
            {ctaLabel}
          </button>
        </Link>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontFamily: "var(--font-dm-mono), monospace",
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "var(--ds-text-muted)",
        marginBottom: 16,
      }}
    >
      {children}
    </p>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type BuilderProfile = {
  id: string;
  username: string;
  name: string;
  city: string;
  bio: string | null;
  skills: string[];
  github_handle: string | null;
  project_count: number;
};

export function DashboardContent({
  builder,
  userEmail,
  memberSince,
  locale,
  liveChallenges,
  activityItems,
}: {
  builder: BuilderProfile | null;
  userEmail: string | null;
  memberSince: string;
  locale: string;
  liveChallenges: LiveChallenge[];
  activityItems: ActivityItem[];
}) {
  const displayName = builder?.name ?? userEmail?.split("@")[0] ?? "Builder";
  const city = builder?.city ?? null;
  const greeting = getGreeting();

  return (
    <div className="mx-auto max-w-[760px] px-6 py-10">

      {/* ── Welcome header ─────────────────────────────────────────────── */}
      <header>
        <h1
          style={{
            fontFamily: "var(--font-syne), sans-serif",
            fontSize: "clamp(24px, 4vw, 32px)",
            fontWeight: 800,
            color: "var(--ds-text-primary)",
            lineHeight: 1.2,
          }}
        >
          {greeting}, {displayName}.
        </h1>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
          {city && (
            <span
              style={{
                border: `1px solid ${cityColor(city)}44`,
                background: `${cityColor(city)}11`,
                color: cityColor(city),
                fontFamily: "var(--font-dm-mono), monospace",
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                padding: "3px 10px",
                borderRadius: 4,
              }}
            >
              {city}
            </span>
          )}
          <span
            style={{
              fontFamily: "var(--font-dm-mono), monospace",
              fontSize: 11,
              color: "var(--ds-text-muted)",
            }}
          >
            Member since {formatMemberSince(memberSince)}
          </span>
        </div>
      </header>

      {/* ── Profile setup prompt (no profile yet) ─────────────────────── */}
      {!builder && (
        <div
          style={{
            marginTop: 32,
            border: "1px solid var(--ds-border)",
            background: "var(--ds-bg-surface)",
            borderRadius: 6,
            padding: 20,
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-dm-mono), monospace",
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--ds-accent)",
              marginBottom: 8,
            }}
          >
            Action required
          </p>
          <p style={{ fontSize: 14, color: "var(--ds-text-secondary)", lineHeight: 1.6 }}>
            Create your builder profile to unlock challenges, track submissions, and appear in the AI.SEA directory.
          </p>
          <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button
              asChild
              style={{ background: "var(--ds-accent)", color: "#0a0a0a", border: "none" }}
              className="rounded font-medium"
            >
              <Link href="/dashboard/create-profile" locale={locale as "en" | "id" | "zh" | "vi"}>
                <UserPlus className="mr-2 h-4 w-4" />
                Create profile
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              style={{ border: "1px solid var(--ds-border)", color: "var(--ds-text-secondary)", background: "transparent" }}
              className="rounded"
            >
              <Link href="/dashboard/claim-profile" locale={locale as "en" | "id" | "zh" | "vi"}>
                Claim existing profile
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* ── Active challenges strip ────────────────────────────────────── */}
      <section style={{ marginTop: 48 }}>
        <SectionLabel>
          <span style={{ color: "var(--ds-accent)" }}>⬤</span>&nbsp; Live now
        </SectionLabel>

        {liveChallenges.length === 0 ? (
          <p style={{ fontSize: 14, color: "var(--ds-text-muted)", lineHeight: 1.6 }}>
            Nothing live right now — check back soon.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 16,
            }}
          >
            {liveChallenges.map((c) => (
              <ChallengeStripCard key={c.id} challenge={c} />
            ))}
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <Link
            href="/dashboard/challenges"
            locale={locale as "en" | "id" | "zh" | "vi"}
            style={{
              fontFamily: "var(--font-dm-mono), monospace",
              fontSize: 12,
              color: "var(--ds-text-muted)",
              letterSpacing: "0.04em",
            }}
          >
            Browse all challenges →
          </Link>
        </div>
      </section>

      {/* ── Your activity ─────────────────────────────────────────────── */}
      <section style={{ marginTop: 48 }}>
        <SectionLabel>Your activity</SectionLabel>

        {activityItems.length === 0 ? (
          <p style={{ fontSize: 14, color: "var(--ds-text-muted)" }}>
            No activity yet.{" "}
            <Link
              href="/dashboard/challenges"
              locale={locale as "en" | "id" | "zh" | "vi"}
              style={{ color: "var(--ds-accent)" }}
            >
              Take your first challenge →
            </Link>
          </p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {activityItems.map((item) => (
              <li
                key={item.id}
                style={{
                  display: "flex",
                  gap: 20,
                  alignItems: "baseline",
                  padding: "6px 0",
                  borderBottom: "1px solid var(--ds-border-subtle)",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-dm-mono), monospace",
                    fontSize: 12,
                    color: "var(--ds-text-muted)",
                    whiteSpace: "nowrap",
                    minWidth: 52,
                  }}
                >
                  {relativeTime(item.timestamp)}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-dm-mono), monospace",
                    fontSize: 13,
                    color: "var(--ds-text-secondary)",
                  }}
                >
                  {item.type === "enrolled" ? "Enrolled in " : "Submitted to "}
                  <Link
                    href={`/dashboard/challenges/${item.challengeId}`}
                    style={{ color: "var(--ds-text-primary)" }}
                  >
                    {item.challengeTitle}
                  </Link>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Divider ────────────────────────────────────────────────────── */}
      <div style={{ marginTop: 48, borderTop: "1px solid var(--ds-border)" }} />

      {/* ── Quick links ────────────────────────────────────────────────── */}
      <nav style={{ marginTop: 20, display: "flex", gap: 20, flexWrap: "wrap" }}>
        {[
          builder ? { label: "Edit profile", href: "/dashboard/edit-profile" } : null,
          { label: "All challenges", href: "/dashboard/challenges" },
          { label: "Builder directory", href: "/builders" },
        ]
          .filter(Boolean)
          .map((item) => (
            <Link
              key={item!.href}
              href={item!.href as Parameters<typeof Link>[0]["href"]}
              style={{
                fontFamily: "var(--font-dm-mono), monospace",
                fontSize: 12,
                color: "var(--ds-text-muted)",
                letterSpacing: "0.04em",
              }}
            >
              {item!.label} →
            </Link>
          ))}
      </nav>
    </div>
  );
}
