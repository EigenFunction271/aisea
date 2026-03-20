import { Topbar } from "./topbar";
import { SidebarNav } from "./sidebar-nav";
import { MobileMenu } from "./mobile-menu";

export function DashboardShell({
  children,
  locale,
  userEmail,
  userName,
  userCity,
  username,
  userRole,
}: {
  children: React.ReactNode;
  locale: string;
  userEmail: string | null;
  userName: string | null;
  userCity: string | null;
  username: string | null;
  userRole?: string | null;
}) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--ds-bg-base)" }}>
      {/* ── Topbar ── */}
      <header
        className="fixed inset-x-0 top-0 z-50 h-12"
        style={{ borderBottom: "1px solid var(--ds-border)", backgroundColor: "var(--ds-bg-base)" }}
      >
        <div className="flex h-full items-center">
          {/* Mobile hamburger + sheet (client island) */}
          <MobileMenu locale={locale} city={userCity} username={username} role={userRole} />

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
        <SidebarNav locale={locale} city={userCity} username={username} role={userRole} />
      </aside>

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
