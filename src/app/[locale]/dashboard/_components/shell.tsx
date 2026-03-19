"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Topbar } from "./topbar";
import { SidebarNav } from "./sidebar-nav";

export function DashboardShell({
  children,
  locale,
  userEmail,
  userName,
  userCity,
  username,
}: {
  children: React.ReactNode;
  locale: string;
  userEmail: string | null;
  userName: string | null;
  userCity: string | null;
  username: string | null;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--ds-bg-base)" }}>
      {/* ── Topbar ── */}
      <header
        className="fixed inset-x-0 top-0 z-50 h-12"
        style={{ borderBottom: "1px solid var(--ds-border)", backgroundColor: "var(--ds-bg-base)" }}
      >
        <div className="flex h-full items-center">
          {/* Mobile hamburger */}
          <button
            className="flex h-12 w-12 shrink-0 items-center justify-center lg:hidden"
            style={{ color: "var(--ds-text-muted)" }}
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex-1">
            <Topbar
              userEmail={userEmail}
              userName={userName}
              userCity={userCity}
            />
          </div>
        </div>
      </header>

      {/* ── Desktop sidebar ── */}
      <aside
        className="fixed bottom-0 left-0 top-12 z-40 hidden w-[220px] overflow-y-auto lg:block"
        style={{ borderRight: "1px solid var(--ds-border)", backgroundColor: "var(--ds-bg-base)" }}
      >
        <SidebarNav locale={locale} city={userCity} username={username} />
      </aside>

      {/* ── Mobile sidebar sheet ── */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-[220px] p-0"
          style={{ backgroundColor: "var(--ds-bg-base)", borderRight: "1px solid var(--ds-border)" }}
        >
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarNav locale={locale} city={userCity} username={username} />
        </SheetContent>
      </Sheet>

      {/* ── Main content ── */}
      <main
        className="pt-12 lg:ml-[220px]"
        style={{ minHeight: "100dvh" }}
      >
        {children}
      </main>
    </div>
  );
}
