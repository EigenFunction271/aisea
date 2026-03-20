"use client";

import { useRouter } from "next/navigation";

const MONO: React.CSSProperties = {
  fontFamily: "var(--font-dm-mono), monospace",
};

export function SuggestUpdateButton({
  slug,
  locale,
}: {
  slug: string;
  locale: string;
}) {
  const router = useRouter();

  function handleClick() {
    router.push(`/${locale}/dashboard/wiki/p/${slug}/suggest`);
  }

  return (
    <button
      onClick={handleClick}
      style={{
        ...MONO,
        fontSize: 11,
        padding: "3px 10px",
        borderRadius: 4,
        border: "1px solid var(--ds-border)",
        background: "transparent",
        color: "var(--ds-text-muted)",
        cursor: "pointer",
      }}
    >
      Suggest update
    </button>
  );
}
