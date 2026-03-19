"use client";

import { useState } from "react";
import { Link } from "@/i18n/routing";

type Submission = {
  id: string;
  challenge_id: string;
  challengeTitle: string;
  status: string;
  submitted_at: string | null;
};

type SocialLinks = {
  github_handle: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  instagram_url: string | null;
  personal_url: string | null;
  bio: string | null;
};

type Tab = "submissions" | "about";

const MONO: React.CSSProperties = {
  fontFamily: "var(--font-dm-mono), monospace",
};

const STATUS_COLORS: Record<string, string> = {
  accepted: "#4ade80",
  submitted: "var(--ds-accent)",
  under_review: "#fb923c",
  draft: "var(--ds-text-muted)",
  withdrawn: "var(--ds-text-muted)",
  rejected: "#f87171",
};

function relativeDate(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function ProfileTabs({
  submissions,
  social,
  locale,
  challengesPath,
}: {
  submissions: Submission[];
  social: SocialLinks;
  locale: string;
  challengesPath: string;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("submissions");

  const tabStyle = (tab: Tab): React.CSSProperties => ({
    ...MONO,
    fontSize: 11,
    letterSpacing: "0.10em",
    textTransform: "uppercase" as const,
    padding: "8px 0",
    marginRight: 28,
    cursor: "pointer",
    background: "transparent",
    border: "none",
    color: activeTab === tab ? "var(--ds-text-primary)" : "var(--ds-text-muted)",
    borderBottom: activeTab === tab ? "1px solid var(--ds-text-primary)" : "1px solid transparent",
    transition: "color 0.15s",
  });

  const socialItems = [
    { label: "GitHub", url: social.github_handle ? `https://github.com/${social.github_handle}` : null },
    { label: "LinkedIn", url: social.linkedin_url },
    { label: "Twitter / X", url: social.twitter_url },
    { label: "Instagram", url: social.instagram_url },
    { label: "Portfolio", url: social.personal_url },
  ].filter((s) => Boolean(s.url));

  return (
    <div>
      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid var(--ds-border)",
          marginBottom: 24,
        }}
      >
        <button style={tabStyle("submissions")} onClick={() => setActiveTab("submissions")}>
          Submissions
        </button>
        <button style={tabStyle("about")} onClick={() => setActiveTab("about")}>
          About
        </button>
      </div>

      {/* SUBMISSIONS tab */}
      {activeTab === "submissions" && (
        <div>
          {submissions.length === 0 ? (
            <div style={{ padding: "32px 0" }}>
              <p style={{ fontSize: 14, color: "var(--ds-text-muted)" }}>
                No submissions yet.{" "}
                <Link
                  href="/dashboard/challenges"
                  locale={locale as "en" | "id" | "zh" | "vi"}
                  style={{ color: "var(--ds-accent)", textDecoration: "none" }}
                >
                  Take your first challenge →
                </Link>
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {submissions.map((sub) => (
                <a
                  key={sub.id}
                  href={`${challengesPath}/${sub.challenge_id}`}
                  style={{ textDecoration: "none" }}
                >
                  <div
                    style={{
                      border: "1px solid var(--ds-border)",
                      borderRadius: 6,
                      padding: "14px 16px",
                      background: "var(--ds-bg-surface)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 16,
                      transition: "border-color 0.15s",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = "#333")}
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLDivElement).style.borderColor = "var(--ds-border)")
                    }
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontFamily: "var(--font-syne), sans-serif",
                          fontSize: 14,
                          fontWeight: 600,
                          color: "var(--ds-text-primary)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {sub.challengeTitle}
                      </p>
                      <p
                        style={{
                          ...MONO,
                          fontSize: 11,
                          color: "var(--ds-text-muted)",
                          marginTop: 3,
                        }}
                      >
                        {relativeDate(sub.submitted_at)}
                      </p>
                    </div>
                    <span
                      style={{
                        ...MONO,
                        fontSize: 10,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase" as const,
                        padding: "3px 8px",
                        borderRadius: 4,
                        color: STATUS_COLORS[sub.status] ?? "var(--ds-text-muted)",
                        border: `1px solid ${STATUS_COLORS[sub.status] ?? "var(--ds-border)"}40`,
                        flexShrink: 0,
                      }}
                    >
                      {sub.status.replace("_", " ")}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ABOUT tab */}
      {activeTab === "about" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {social.bio && (
            <p style={{ fontSize: 14, color: "var(--ds-text-secondary)", lineHeight: 1.6 }}>
              {social.bio}
            </p>
          )}
          {socialItems.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {socialItems.map((item) => (
                <a
                  key={item.label}
                  href={item.url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    ...MONO,
                    fontSize: 12,
                    color: "var(--ds-accent)",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span style={{ color: "var(--ds-text-muted)", minWidth: 80 }}>{item.label}</span>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.url}
                  </span>
                </a>
              ))}
            </div>
          ) : (
            !social.bio && (
              <p style={{ fontSize: 14, color: "var(--ds-text-muted)" }}>No links added yet.</p>
            )
          )}
        </div>
      )}
    </div>
  );
}
