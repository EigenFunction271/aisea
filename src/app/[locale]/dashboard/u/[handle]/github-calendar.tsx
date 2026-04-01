"use client";

import GitHubCalendar from "react-github-calendar";

const MONO: React.CSSProperties = {
  fontFamily: "var(--font-dm-mono), monospace",
};

// Match the platform's accent green and dark background
const THEME = {
  dark: [
    "rgba(255,255,255,0.05)", // no contributions
    "rgba(0,255,180,0.15)",
    "rgba(0,255,180,0.35)",
    "rgba(0,255,180,0.60)",
    "rgba(0,255,180,0.90)", // max contributions
  ],
};

export function GitHubCalendarCard({ githubHandle }: { githubHandle: string }) {
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

      <GitHubCalendar
        username={githubHandle}
        theme={THEME}
        colorScheme="dark"
        blockSize={10}
        blockMargin={3}
        fontSize={11}
        hideColorLegend={false}
        hideMonthLabels={false}
        hideTotalCount={false}
        style={{ fontFamily: "var(--font-dm-mono), monospace" }}
        errorMessage="Could not load contribution data."
      />
    </div>
  );
}
