import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function ProfileRedirectPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login?next=/${locale}/dashboard/profile`);
  }

  const { data: link } = await admin
    .from("builder_auth")
    .select("builder_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!link) {
    redirect(`/${locale}/dashboard/create-profile`);
  }

  const { data: builder } = await admin
    .from("builders")
    .select("username")
    .eq("id", link.builder_id)
    .maybeSingle();

  if (!builder?.username) {
    redirect(`/${locale}/dashboard`);
  }

  redirect(`/${locale}/dashboard/u/${builder.username}`);
}
