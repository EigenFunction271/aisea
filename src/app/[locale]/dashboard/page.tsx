import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar1 } from "@/components/ui/navbar";
import { DashboardContent } from "./dashboard-content";
import { routing } from "@/i18n/routing";

type BuilderProfile = {
  id: string;
  username: string;
  name: string;
  city: string;
  bio: string | null;
  skills: string[];
  github_handle: string | null;
  project_count: number;
};

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isValidLocale = (loc: string): loc is (typeof routing.locales)[number] =>
    routing.locales.includes(loc as (typeof routing.locales)[number]);
  if (!isValidLocale(locale)) redirect(`/${routing.defaultLocale}/dashboard`);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login?next=/${locale}/dashboard`);
  }

  const { data: link } = await supabase
    .from("builder_auth")
    .select("builder_id")
    .eq("user_id", user.id)
    .maybeSingle();

  let builder: BuilderProfile | null = null;
  if (link?.builder_id) {
    const { data: b } = await supabase
      .from("builders")
      .select("id, username, name, city, bio, skills, github_handle")
      .eq("id", link.builder_id)
      .single();
    if (b) {
      const { count } = await supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("builder_id", b.id);
      builder = {
        ...b,
        skills: (b.skills ?? []) as string[],
        project_count: count ?? 0,
      };
    }
  }

  return (
    <main className="min-h-screen bg-black">
      <Navbar1 />
      <DashboardContent builder={builder} userEmail={user.email ?? undefined} />
    </main>
  );
}
