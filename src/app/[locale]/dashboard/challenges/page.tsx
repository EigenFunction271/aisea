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

async function getUserRole(userId: string): Promise<"member" | "admin" | "super_admin"> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("get_profile_role", {
    target_user_id: userId,
  });
  if (error) return "member";
  if (data === "admin" || data === "super_admin") return data;
  return "member";
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
  const role = user ? await getUserRole(user.id) : "member";

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
    <div className="mx-auto max-w-7xl px-6 py-8">
      <h1
        className="text-2xl font-bold"
        style={{ fontFamily: "var(--font-syne), sans-serif", color: "var(--ds-text-primary)" }}
      >
        Challenges
      </h1>
      <p className="mt-2 text-sm" style={{ color: "var(--ds-text-secondary)" }}>
        Join active challenges, submit your build, and track judging outcomes.
      </p>
      <ChallengesList
        active={active}
        archived={archived}
        access={{ isAuthenticated, isProfileComplete, isAdmin: role === "admin" || role === "super_admin" }}
        locale={locale}
      />
    </div>
  );
}
