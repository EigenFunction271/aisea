"use client";

import { ChevronDown } from "lucide-react";

interface HeroScrollIndicatorProps {
  /** Label shown below the chevron (e.g. "Scroll to explore"). Pass translated string from page. */
  label?: string;
  /** Optional class name for the wrapper. */
  className?: string;
}

/**
 * Subtle mobile-only cue at the bottom of hero sections to encourage scrolling.
 * Hidden from md and up.
 */
export function HeroScrollIndicator({ label = "Scroll to explore", className = "" }: HeroScrollIndicatorProps) {
  return (
    <div
      className={`md:hidden absolute bottom-6 left-0 right-0 flex flex-col items-center gap-1.5 pointer-events-none z-10 ${className}`}
      aria-hidden="true"
    >
      <span className="font-[family-name:var(--font-geist-mono)] text-xs text-white/50 tracking-wide">
        {label}
      </span>
      <ChevronDown
        className="w-5 h-5 text-white/40 animate-bounce"
        strokeWidth={2}
        aria-hidden
      />
    </div>
  );
}
