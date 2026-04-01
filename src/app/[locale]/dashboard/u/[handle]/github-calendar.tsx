"use client";

import { ActivityCalendar } from "react-activity-calendar";
import "react-activity-calendar/tooltips.css";

import { Link } from "@/i18n/routing";
import { useLocale } from "next-intl";

import type { ContributionActivity } from "@/lib/github/contribution-calendar";

const MONO: React.CSSProperties = {
  fontFamily: "var(--font-dm-mono), monospace",
};

const THEME = {
  dark: [
    "rgba(255,255,255,0.05)",
    "rgba(0,255,180,0.15)",
    "rgba(0,255,180,0.35)",
    "rgba(0,255,180,0.60)",
    "rgba(0,255,180,0.90)",
  ],
};

export function GitHubCalendarCard({
  activities,
  showLinkGithubHint,
}: {
  activities: ContributionActivity[];
  showLinkGithubHint?: boolean;
}) {
  const locale = useLocale();

  if (!activities.length) {
    return null;
  }

  return (
    <div
      style={{
        border: "1px solid var(--ds-border)",
        borderRadius: 8,
        background: "var(--ds-bg-surface)",
        padding: "14px 18px",
        marginBottom: 16,
      }}
    >
      <span
        style={{
          ...MONO,
          fontSize: 10,
          letterSpacing: "0.10em",
          textTransform: "uppercase",
          color: "var(--ds-text-muted)",
          display: "block",
          marginBottom: 14,
        }}
      >
        Contributions
      </span>

      <ActivityCalendar
        data={activities}
        theme={THEME}
        colorScheme="dark"
        blockSize={10}
        blockMargin={3}
        fontSize={11}
        maxLevel={4}
        showColorLegend
        showMonthLabels
        showTotalCount
        style={{ fontFamily: "var(--font-dm-mono), monospace" }}
        labels={{
          totalCount: "{{count}} contributions in the last year",
        }}
      />

      {showLinkGithubHint ? (
        <p
          style={{
            ...MONO,
            fontSize: 11,
            color: "var(--ds-text-muted)",
            marginTop: 14,
            lineHeight: 1.5,
          }}
        >
          Totals may be lower than on GitHub until you{" "}
          <Link
            href="/dashboard/edit-profile"
            locale={locale as "en" | "id" | "zh" | "vi"}
            className="underline text-[var(--ds-accent)] hover:opacity-90"
          >
            link your GitHub account
          </Link>{" "}
          (or sign in with GitHub). That uses GitHub’s own data, including private contributions if you show them on your GitHub profile.
        </p>
      ) : null}
    </div>
  );
}
