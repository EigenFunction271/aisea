import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ChallengeForm } from "../admin/challenge-form";

export default async function ProposeChallengePage({
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
    redirect(`/${locale}/login?next=/${locale}/dashboard/challenges/propose`);
  }

  const { data: roleData } = await supabase.rpc("get_profile_role", {
    target_user_id: user.id,
  });
  const role = roleData as string | null;
  if (role === "admin" || role === "super_admin") {
    redirect(`/${locale}/dashboard/challenges/admin/new`);
  }

  const { data: complete } = await admin.rpc("is_profile_complete_for_challenges", {
    target_user_id: user.id,
  });
  if (complete !== true) {
    redirect(`/${locale}/dashboard/profile?next=/${locale}/dashboard/challenges/propose`);
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-2xl font-semibold text-white">Propose a challenge</h1>
      <p className="mt-2 max-w-2xl text-sm text-white/70">
        Fill out the details below. Your proposal is sent to the team for review. It will appear on the
        public challenges list only after an admin publishes it.
      </p>
      <ChallengeForm mode="create" variant="proposal" />
    </div>
  );
}
