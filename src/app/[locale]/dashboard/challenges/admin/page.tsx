import { redirect } from "next/navigation";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminChallengesPage({
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
  if (!user) redirect(`/${locale}/login?next=/${locale}/dashboard/challenges/admin`);

  const { data: roleData } = await admin.rpc("get_profile_role", { target_user_id: user.id });
  const role = roleData as string | null;
  if (role !== "admin" && role !== "super_admin") {
    redirect(`/${locale}/dashboard/challenges`);
  }

  let query = admin
    .from("challenges")
    .select("id, title, subtitle, hero_image_url, status, end_at, created_by, updated_at")
    .order("updated_at", { ascending: false });

  if (role === "admin") query = query.eq("created_by", user.id);
  const { data: challenges } = await query;

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-white">Challenge Admin</h1>
            <p className="mt-1 text-sm text-white/70">Manage challenge drafts, lifecycle state, review, and winners.</p>
          </div>
          <Button asChild className="rounded-full">
            <Link href="/dashboard/challenges/admin/new">Create challenge</Link>
          </Button>
        </div>

        <div className="mt-6 space-y-3">
          {(challenges ?? []).map((challenge) => (
            <div key={challenge.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-3">
                <div
                  className="h-14 w-20 rounded-md bg-white/10"
                  style={
                    challenge.hero_image_url
                      ? {
                          backgroundImage: `url(${challenge.hero_image_url})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }
                      : undefined
                  }
                />
                <div>
                <p className="font-medium text-white">{challenge.title}</p>
                <p className="text-xs text-white/60">{challenge.subtitle}</p>
                <p className="text-xs text-white/60">
                  Status: {challenge.status} · Ends {new Date(challenge.end_at).toLocaleDateString()}
                </p>
                </div>
              </div>
              <Button asChild size="sm" variant="outline" className="rounded-full border-white/20 text-white hover:bg-white/10">
                <Link href={`/dashboard/challenges/admin/${challenge.id}`}>Manage</Link>
              </Button>
            </div>
          ))}
          {challenges?.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-center">
              <p className="text-white">No challenges yet.</p>
              <p className="mt-2 text-sm text-white/60">Create your first challenge draft to get started.</p>
            </div>
          ) : null}
        </div>
    </div>
  );
}
