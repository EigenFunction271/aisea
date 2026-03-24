import { routing } from "@/i18n/routing";

const localeSet = new Set<string>(routing.locales);

/**
 * Collapse accidental duplicate locale segments, e.g. `/en/en/dashboard` → `/en/dashboard`.
 * Often caused by Supabase Site URL including a locale path, or a bad `next` query value.
 */
export function dedupeLeadingLocalePath(path: string): string {
  if (!path.startsWith("/")) return path;
  const parts = path.split("/").filter(Boolean);
  while (
    parts.length >= 2 &&
    parts[0] === parts[1] &&
    localeSet.has(parts[0])
  ) {
    parts.splice(1, 1);
  }
  return "/" + parts.join("/");
}

/**
 * Remove a single leading locale segment so next-intl router can add locale exactly once.
 * Example: `/vi/dashboard` -> `/dashboard`, `/dashboard` -> `/dashboard`.
 */
export function stripLeadingLocalePath(path: string): string {
  if (!path.startsWith("/")) return path;
  const parts = path.split("/").filter(Boolean);
  if (parts.length > 0 && localeSet.has(parts[0])) {
    parts.shift();
  }
  return "/" + parts.join("/");
}
