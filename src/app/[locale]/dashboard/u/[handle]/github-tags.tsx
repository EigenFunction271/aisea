"use client";

import { useState } from "react";

const MONO: React.CSSProperties = {
  fontFamily: "var(--font-dm-mono), monospace",
};

const LANGUAGE_COLORS: Record<string, string> = {
  Python: "#3572A5",
  TypeScript: "#2b7489",
  JavaScript: "#f1e05a",
  Go: "#00ADD8",
  Rust: "#dea584",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  Ruby: "#701516",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
  Shell: "#89e051",
  HTML: "#e34c26",
  CSS: "#563d7c",
};

function langColor(lang: string): string {
  return LANGUAGE_COLORS[lang] ?? "var(--ds-accent)";
}

const ACTIVITY_DOT: Record<string, { color: string; label: string }> = {
  active: { color: "#4ade80", label: "Active" },
  occasional: { color: "#fb923c", label: "Occasional" },
  dormant: { color: "#6b7280", label: "Dormant" },
};

const LIBS_COLLAPSED = 5;

export function GitHubTags({
  activityStatus,
  primaryLanguages,
  aiLibs,
  focusAreas,
}: {
  activityStatus: string | null;
  primaryLanguages: string[];
  aiLibs: string[];
  focusAreas: string[];
}) {
  const [libsExpanded, setLibsExpanded] = useState(false);

  const hasAnyData =
    activityStatus ||
    primaryLanguages.length > 0 ||
    aiLibs.length > 0 ||
    focusAreas.length > 0;

  if (!hasAnyData) return null;

  const visibleLibs = libsExpanded ? aiLibs : aiLibs.slice(0, LIBS_COLLAPSED);
  const hiddenLibsCount = aiLibs.length - LIBS_COLLAPSED;

  const dot = activityStatus ? ACTIVITY_DOT[activityStatus] : null;

  return (
    <div
      style={{
        border: "1px solid var(--ds-border)",
        borderRadius: 8,
        background: "var(--ds-bg-surface)",
        padding: "14px 18px",
        marginBottom: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {/* Header row: "GitHub profile" label + activity dot */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          style={{
            ...MONO,
            fontSize: 10,
            letterSpacing: "0.10em",
            textTransform: "uppercase",
            color: "var(--ds-text-muted)",
          }}
        >
          GitHub profile
        </span>
        {dot && (
          <span
            style={{
              ...MONO,
              fontSize: 10,
              letterSpacing: "0.08em",
              display: "flex",
              alignItems: "center",
              gap: 5,
              color: dot.color,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: dot.color,
                flexShrink: 0,
              }}
            />
            {dot.label}
          </span>
        )}
      </div>

      {/* Languages */}
      {primaryLanguages.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
          <span
            style={{
              ...MONO,
              fontSize: 9,
              letterSpacing: "0.08em",
              color: "var(--ds-text-muted)",
              textTransform: "uppercase",
              minWidth: 60,
            }}
          >
            Languages
          </span>
          {primaryLanguages.map((lang) => (
            <span
              key={lang}
              style={{
                ...MONO,
                fontSize: 10,
                letterSpacing: "0.06em",
                padding: "3px 8px",
                borderRadius: 4,
                background: `${langColor(lang)}18`,
                border: `1px solid ${langColor(lang)}44`,
                color: langColor(lang),
              }}
            >
              {lang}
            </span>
          ))}
        </div>
      )}

      {/* Focus areas */}
      {focusAreas.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
          <span
            style={{
              ...MONO,
              fontSize: 9,
              letterSpacing: "0.08em",
              color: "var(--ds-text-muted)",
              textTransform: "uppercase",
              minWidth: 60,
            }}
          >
            Focus
          </span>
          {focusAreas.map((area) => (
            <span
              key={area}
              style={{
                ...MONO,
                fontSize: 10,
                letterSpacing: "0.06em",
                padding: "3px 8px",
                borderRadius: 4,
                border: "1px solid rgba(0,255,180,0.25)",
                color: "var(--ds-accent)",
                background: "rgba(0,255,180,0.06)",
              }}
            >
              {area}
            </span>
          ))}
        </div>
      )}

      {/* AI libraries */}
      {aiLibs.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
          <span
            style={{
              ...MONO,
              fontSize: 9,
              letterSpacing: "0.08em",
              color: "var(--ds-text-muted)",
              textTransform: "uppercase",
              minWidth: 60,
            }}
          >
            AI libs
          </span>
          {visibleLibs.map((lib) => (
            <span
              key={lib}
              style={{
                ...MONO,
                fontSize: 10,
                letterSpacing: "0.04em",
                padding: "3px 8px",
                borderRadius: 4,
                background: "var(--ds-bg-elevated, rgba(255,255,255,0.04))",
                border: "1px solid var(--ds-border)",
                color: "var(--ds-text-secondary)",
              }}
            >
              {lib}
            </span>
          ))}
          {!libsExpanded && hiddenLibsCount > 0 && (
            <button
              onClick={() => setLibsExpanded(true)}
              style={{
                ...MONO,
                fontSize: 10,
                letterSpacing: "0.06em",
                padding: "3px 8px",
                borderRadius: 4,
                background: "transparent",
                border: "1px solid var(--ds-border)",
                color: "var(--ds-text-muted)",
                cursor: "pointer",
              }}
            >
              +{hiddenLibsCount} more
            </button>
          )}
          {libsExpanded && aiLibs.length > LIBS_COLLAPSED && (
            <button
              onClick={() => setLibsExpanded(false)}
              style={{
                ...MONO,
                fontSize: 10,
                letterSpacing: "0.06em",
                padding: "3px 8px",
                borderRadius: 4,
                background: "transparent",
                border: "1px solid var(--ds-border)",
                color: "var(--ds-text-muted)",
                cursor: "pointer",
              }}
            >
              Show less
            </button>
          )}
        </div>
      )}
    </div>
  );
}
