import { createClient } from "@/lib/supabase/server";
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

  let userName: string | null = null;
  let userCity: string | null = null;
  let username: string | null = null;

  if (user) {
    const { data: link } = await supabase
      .from("builder_auth")
      .select("builder_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (link?.builder_id) {
      const { data: builder } = await supabase
        .from("builders")
        .select("name, city, username")
        .eq("id", link.builder_id)
        .maybeSingle();

      userName = builder?.name ?? null;
      userCity = builder?.city ?? null;
      username = builder?.username ?? null;
    }
  }

  return (
    <DashboardShell
      locale={locale}
      userEmail={user?.email ?? null}
      userName={userName}
      userCity={userCity}
      username={username}
    >
      {children}
    </DashboardShell>
  );
}
