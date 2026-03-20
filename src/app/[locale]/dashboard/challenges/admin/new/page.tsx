import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChallengeForm } from "../challenge-form";

export default async function NewChallengePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=/${locale}/dashboard/challenges/admin/new`);

  // get_profile_role is SECURITY DEFINER — callable from the user-scoped client.
  const { data: roleData } = await supabase.rpc("get_profile_role", { target_user_id: user.id });
  const role = roleData as string | null;
  if (role !== "admin" && role !== "super_admin") {
    redirect(`/${locale}/dashboard/challenges`);
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-2xl font-semibold text-white">Create Challenge</h1>
      <p className="mt-2 text-sm text-white/70">
        Build your draft, preview it, and publish when ready.
      </p>
      <ChallengeForm mode="create" />
    </div>
  );
}
