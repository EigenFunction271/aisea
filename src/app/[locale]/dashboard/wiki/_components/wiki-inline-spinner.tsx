import type { CSSProperties } from "react";
import { Spinner } from "@/components/ui/spinner";

const MONO: CSSProperties = {
  fontFamily: "var(--font-dm-mono), monospace",
};

/** Consistent async feedback for wiki flows (editor, admin tree, attachments, delete, review). */
export function WikiInlineSpinner({
  label,
  sizeClassName = "size-3.5",
}: {
  label?: string;
  /** Tailwind size, e.g. size-3.5, size-4 */
  sizeClassName?: string;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        ...MONO,
        fontSize: 12,
        color: "var(--ds-text-muted)",
      }}
    >
      <Spinner className={`${sizeClassName} shrink-0 text-[var(--ds-accent)]`} aria-hidden />
      {label ? <span>{label}</span> : null}
    </span>
  );
}
