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

  // Single join query — avoids the previous 3-step sequential waterfall.
  const { data: link } = await admin
    .from("builder_auth")
    .select("builder_id, builders(username)")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!link?.builder_id) {
    redirect(`/${locale}/dashboard/create-profile`);
  }

  const username = (link.builders as unknown as { username: string } | null)?.username;
  if (!username) {
    redirect(`/${locale}/dashboard`);
  }

  redirect(`/${locale}/dashboard/u/${username}`);
}
