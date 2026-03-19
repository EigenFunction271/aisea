"use client";

import { usePathname, useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Link } from "@/i18n/routing";
import { Bell, LogOut, User, ChevronRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

const CITY_FLAGS: Record<string, string> = {
  "kuala lumpur": "🇲🇾",
  "kl": "🇲🇾",
  "singapore": "🇸🇬",
  "jakarta": "🇮🇩",
  "manila": "🇵🇭",
  "ho chi minh": "🇻🇳",
  "hcmc": "🇻🇳",
  "bangkok": "🇹🇭",
};

function cityColor(city: string | null): string {
  if (!city) return "var(--ds-city-other)";
  const key = city.toLowerCase();
  for (const [k, v] of Object.entries(CITY_COLORS)) {
    if (key.includes(k)) return v;
  }
  return "var(--ds-city-other)";
}

function cityFlag(city: string | null): string {
  if (!city) return "🌐";
  const key = city.toLowerCase();
  for (const [k, v] of Object.entries(CITY_FLAGS)) {
    if (key.includes(k)) return v;
  }
  return "🌐";
}

function getBreadcrumb(pathname: string): string | null {
  if (/\/dashboard\/challenges\/admin/.test(pathname)) return "Admin";
  if (/\/dashboard\/challenges/.test(pathname)) return "Challenges";
  if (/\/dashboard\/(edit|create)-profile/.test(pathname)) return "Profile";
  if (/\/dashboard\/settings/.test(pathname)) return "Settings";
  return null;
}

function UserAvatar({ initial }: { initial: string }) {
  return (
    <div
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-medium select-none cursor-pointer"
      style={{
        background: "var(--ds-bg-raised)",
        border: "1px solid var(--ds-border)",
        color: "var(--ds-text-primary)",
        fontFamily: "var(--font-dm-mono), monospace",
      }}
    >
      {initial}
    </div>
  );
}

export function Topbar({
  userEmail,
  userName,
  userCity,
}: {
  userEmail: string | null;
  userName: string | null;
  userCity: string | null;
}) {
  const pathname = usePathname();
  const params = useParams();
  const locale = (params?.locale as string) ?? "en";
  const router = useRouter();
  const breadcrumb = getBreadcrumb(pathname);
  const initial = (userName?.[0] ?? userEmail?.[0] ?? "?").toUpperCase();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/${locale}`);
  }

  return (
    <div className="flex h-full items-center gap-3 px-4">
      {/* Wordmark */}
      <Link
        href="/dashboard"
        locale={locale as "en" | "id" | "zh" | "vi"}
        className="shrink-0 text-sm font-semibold tracking-tight"
        style={{ fontFamily: "var(--font-syne), sans-serif", color: "var(--ds-text-primary)" }}
      >
        AI.SEA
      </Link>

      {/* Breadcrumb */}
      {breadcrumb && (
        <div className="flex items-center gap-1.5">
          <ChevronRight className="h-3 w-3" style={{ color: "var(--ds-text-muted)" }} />
          <span
            className="text-[11px] tracking-widest uppercase"
            style={{ fontFamily: "var(--font-dm-mono), monospace", color: "var(--ds-text-muted)" }}
          >
            {breadcrumb}
          </span>
        </div>
      )}

      <div className="flex-1" />

      {/* City badge */}
      {userCity && (
        <div
          className="hidden items-center gap-1.5 rounded px-2 py-0.5 sm:flex"
          style={{
            border: `1px solid ${cityColor(userCity)}33`,
            backgroundColor: `${cityColor(userCity)}11`,
          }}
        >
          <span className="text-[11px]">{cityFlag(userCity)}</span>
          <span
            className="text-[11px] uppercase tracking-widest"
            style={{ fontFamily: "var(--font-dm-mono), monospace", color: cityColor(userCity) }}
          >
            {userCity}
          </span>
        </div>
      )}

      {/* Notification bell — present, non-functional in MVP */}
      <button
        className="relative flex h-7 w-7 items-center justify-center rounded transition-colors"
        style={{ color: "var(--ds-text-muted)" }}
        aria-label="Notifications"
        tabIndex={0}
      >
        <Bell className="h-4 w-4" />
      </button>

      {/* Avatar dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="focus:outline-none" aria-label="Account menu">
            <UserAvatar initial={initial} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-52"
          style={{ background: "var(--ds-bg-surface)", border: "1px solid var(--ds-border)" }}
        >
          {userEmail && (
            <>
              <div className="px-3 py-2">
                <p
                  className="truncate text-[11px]"
                  style={{ fontFamily: "var(--font-dm-mono), monospace", color: "var(--ds-text-muted)" }}
                >
                  {userEmail}
                </p>
              </div>
              <DropdownMenuSeparator style={{ backgroundColor: "var(--ds-border)" }} />
            </>
          )}
          <DropdownMenuItem asChild>
            <Link
              href="/dashboard/edit-profile"
              locale={locale as "en" | "id" | "zh" | "vi"}
              className="flex cursor-pointer items-center gap-2 text-[13px]"
              style={{ color: "var(--ds-text-secondary)" }}
            >
              <User className="h-3.5 w-3.5" />
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator style={{ backgroundColor: "var(--ds-border)" }} />
          <DropdownMenuItem
            onClick={handleSignOut}
            className="flex cursor-pointer items-center gap-2 text-[13px]"
            style={{ color: "var(--ds-text-secondary)" }}
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
