"use client";

import type { CSSProperties, ReactNode } from "react";

/** RSC cannot use pointer events; use this for hover affordances on wiki pages. */

export function WikiHoverBorderAccent({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{ ...style, transition: "border-color 0.15s" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--ds-accent)44";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--ds-border)";
      }}
    >
      {children}
    </div>
  );
}

export function WikiHoverListRowIndent({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{ ...style, transition: "padding-left 0.1s" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.paddingLeft = "6px";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.paddingLeft = "0px";
      }}
    >
      {children}
    </div>
  );
}
