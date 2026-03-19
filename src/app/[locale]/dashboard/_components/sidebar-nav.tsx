"use client";

import { usePathname } from "next/navigation";
import { Link } from "@/i18n/routing";
import Image from "next/image";

type NavItem = { label: string; href: string };

const NAV_ITEMS: NavItem[] = [
  { label: "HOME", href: "/dashboard" },
  { label: "CHALLENGES", href: "/dashboard/challenges" },
  { label: "PROFILE", href: "/dashboard/profile" },
];

const BOTTOM_ITEMS: NavItem[] = [
  { label: "SETTINGS", href: "/dashboard/settings" },
];

const CITY_COLORS: Record<string, string> = {
  "kuala lumpur": "var(--ds-city-kl)",
  "kl": "var(--ds-city-kl)",
  "singapore": "var(--ds-city-sg)",
  "jakarta": "var(--ds-city-jkt)",
  "manila": "var(--ds-city-mnl)",
  "ho chi minh": "var(--ds-city-hcmc)",
  "hcmc": "var(--ds-city-hcmc)",
  "bangkok": "var(--ds-city-bkk)",
};

function cityColor(city: string | null): string {
  if (!city) return "var(--ds-city-other)";
  const key = city.toLowerCase();
  for (const [k, v] of Object.entries(CITY_COLORS)) {
    if (key.includes(k)) return v;
  }
  return "var(--ds-city-other)";
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return /\/dashboard$/.test(pathname);
  if (href === "/dashboard/profile") {
    return pathname.includes("/dashboard/profile") || pathname.includes("/dashboard/u/");
  }
  return pathname.includes(href.replace("/dashboard", ""));
}

function NavLink({ item, locale }: { item: NavItem; locale: string }) {
  const pathname = usePathname();
  const active = isActive(pathname, item.href);

  return (
    <Link
      href={item.href as Parameters<typeof Link>[0]["href"]}
      locale={locale as "en" | "id" | "zh" | "vi"}
      className="relative flex h-9 w-full items-center px-4 text-[11px] tracking-widest transition-colors"
      style={{
        fontFamily: "var(--font-dm-mono), monospace",
        color: active ? "var(--ds-text-primary)" : "var(--ds-text-muted)",
        backgroundColor: active ? "var(--ds-bg-raised)" : "transparent",
        borderLeft: active ? "2px solid var(--ds-accent)" : "2px solid transparent",
      }}
    >
      {item.label}
    </Link>
  );
}

export function SidebarNav({
  locale,
  city,
  username,
}: {
  locale: string;
  city: string | null;
  username: string | null;
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-12 items-center px-4" style={{ borderBottom: "1px solid var(--ds-border)" }}>
        <Link href="/dashboard" locale={locale as "en" | "id" | "zh" | "vi"}>
          <Image src="/icon1.png" alt="AI.SEA" width={24} height={24} className="opacity-80" />
        </Link>
      </div>

      {/* Primary nav */}
      <nav className="flex-1 py-4">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} locale={locale} />
        ))}

        {/* Divider */}
        <div className="mx-4 my-3" style={{ borderTop: "1px solid var(--ds-border)" }} />

        {/* City node */}
        {city && (
          <div className="px-4 py-2">
            <p
              className="text-[10px] tracking-widest uppercase"
              style={{ fontFamily: "var(--font-dm-mono), monospace", color: "var(--ds-text-muted)" }}
            >
              Node
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: cityColor(city) }}
              />
              <span
                className="text-[11px] tracking-wide"
                style={{
                  fontFamily: "var(--font-dm-mono), monospace",
                  color: cityColor(city),
                }}
              >
                {city}
              </span>
            </div>
          </div>
        )}

        {username && (
          <p
            className="px-4 pt-1 text-[10px] truncate"
            style={{ fontFamily: "var(--font-dm-mono), monospace", color: "var(--ds-text-muted)" }}
          >
            @{username}
          </p>
        )}
      </nav>

      {/* Bottom */}
      <div style={{ borderTop: "1px solid var(--ds-border)" }}>
        {BOTTOM_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} locale={locale} />
        ))}
      </div>
    </div>
  );
}
