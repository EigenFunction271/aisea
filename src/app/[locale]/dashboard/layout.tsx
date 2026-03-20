import { createClient } from "@/lib/supabase/server";
import { getCachedBuilderProfile } from "@/lib/queries/builder-profile";
import { DashboardShell } from "./_components/shell";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user ? await getCachedBuilderProfile(user.id) : null;

  return (
    <DashboardShell
      locale={locale}
      userEmail={user?.email ?? null}
      userName={profile?.name ?? null}
      userCity={profile?.city ?? null}
      username={profile?.username ?? null}
      userRole={profile?.role ?? null}
    >
      {children}
    </DashboardShell>
  );
}
