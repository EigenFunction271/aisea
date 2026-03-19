import { Navbar1 } from "@/components/ui/navbar";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ChallengesList } from "./challenges-list";
import type { ChallengeCard } from "./types";

async function getProfileCompleteState(userId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("is_profile_complete_for_challenges", {
    target_user_id: userId,
  });
  if (error) return false;
  return data === true;
}

function deriveEnrollmentState(
  challenge: { status: "published" | "archived"; end_at: string },
  enrollmentExists: boolean,
  hasSubmission: boolean
): ChallengeCard["enrollment_state"] {
  if (challenge.status === "archived") return "archived";
  if (hasSubmission) return "submitted";
  if (enrollmentExists) return "enrolled";
  return "not_enrolled";
}

export default async function DashboardChallengesPage({
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

  const isAuthenticated = Boolean(user);
  const isProfileComplete = user ? await getProfileCompleteState(user.id) : false;

  const { data: challenges } = await admin
    .from("challenges")
    .select("id, title, subtitle, hero_image_url, reward_text, host_name, org_name, tags, status, end_at")
    .in("status", ["published", "archived"])
    .order("created_at", { ascending: false });

  const challengeIds = (challenges ?? []).map((c) => c.id);

  let enrollmentSet = new Set<string>();
  let submittedSet = new Set<string>();

  if (user && challengeIds.length > 0) {
    const [{ data: enrollments }, { data: submissions }] = await Promise.all([
      admin
        .from("challenge_enrollments")
        .select("challenge_id")
        .eq("user_id", user.id)
        .in("challenge_id", challengeIds),
      admin
        .from("challenge_submissions")
        .select("challenge_id")
        .eq("user_id", user.id)
        .in("challenge_id", challengeIds),
    ]);

    enrollmentSet = new Set((enrollments ?? []).map((e) => e.challenge_id));
    submittedSet = new Set((submissions ?? []).map((s) => s.challenge_id));
  }

  const cards: ChallengeCard[] = (challenges ?? []).map((challenge) => ({
    ...challenge,
    tags: challenge.tags ?? [],
    enrollment_state: deriveEnrollmentState(
      challenge,
      enrollmentSet.has(challenge.id),
      submittedSet.has(challenge.id)
    ),
  }));

  const active = cards.filter((c) => c.status === "published");
  const archived = cards.filter((c) => c.status === "archived");

  return (
    <main className="min-h-screen bg-black">
      <Navbar1 />
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-24">
        <h1 className="font-[family-name:var(--font-geist-mono)] text-2xl font-medium text-white">Challenges</h1>
        <p className="mt-2 text-sm text-white/70">
          Join active challenges, submit your build, and track judging outcomes from your dashboard.
        </p>
        <ChallengesList
          active={active}
          archived={archived}
          access={{ isAuthenticated, isProfileComplete }}
          locale={locale}
        />
      </div>
    </main>
  );
}
