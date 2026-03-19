import { redirect } from "next/navigation";
import { Navbar1 } from "@/components/ui/navbar";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ChallengeForm } from "../challenge-form";

export default async function NewChallengePage({
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
  if (!user) redirect(`/${locale}/login?next=/${locale}/dashboard/challenges/admin/new`);

  const { data: roleData } = await admin.rpc("get_profile_role", { target_user_id: user.id });
  const role = roleData as string | null;
  if (role !== "admin" && role !== "super_admin") {
    redirect(`/${locale}/dashboard/challenges`);
  }

  return (
    <main className="min-h-screen bg-black">
      <Navbar1 />
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-24">
        <h1 className="text-2xl font-semibold text-white">Create Challenge</h1>
        <p className="mt-2 text-sm text-white/70">
          Build your draft, preview it, and publish when ready.
        </p>
        <ChallengeForm mode="create" />
      </div>
    </main>
  );
}
