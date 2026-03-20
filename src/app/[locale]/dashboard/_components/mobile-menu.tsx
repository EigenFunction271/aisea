"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { SidebarNav } from "./sidebar-nav";

export function MobileMenu({
  locale,
  city,
  username,
  role,
}: {
  locale: string;
  city: string | null;
  username: string | null;
  role?: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="flex h-12 w-12 shrink-0 items-center justify-center lg:hidden"
        style={{ color: "var(--ds-text-muted)" }}
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          className="w-[220px] p-0"
          style={{ backgroundColor: "var(--ds-bg-base)", borderRight: "1px solid var(--ds-border)" }}
        >
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarNav locale={locale} city={city} username={username} role={role} />
        </SheetContent>
      </Sheet>
    </>
  );
}
