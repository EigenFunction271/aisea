import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Link } from "@/i18n/routing";
import { ChallengesList } from "./challenges-list";
import type { ChallengeCard } from "./types";

// Challenge list changes only on admin action — no need to re-fetch every render.
export const revalidate = 60;

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

  // ── Phase 1: profile checks + challenge list in parallel ──────────────────
  const [isProfileComplete, role, challengesRes] = await Promise.all([
    user ? getProfileCompleteState(user.id) : Promise.resolve(false),
    user ? getUserRole(user.id) : Promise.resolve<"member">("member"),
    admin
      .from("challenges")
      .select("id, title, subtitle, hero_image_url, reward_text, host_name, org_name, tags, status, start_at, end_at, difficulty")
      .in("status", ["published", "archived"])
      .order("created_at", { ascending: false }),
  ]);

  const isAuthenticated = Boolean(user);
  const challengeIds = (challengesRes.data ?? []).map((c) => c.id);

  let enrollmentSet = new Set<string>();
  let submittedSet = new Set<string>();
  const enrollmentCounts: Record<string, number> = {};

  if (challengeIds.length > 0) {
    // ── Phase 2: user enrollment state + all counts in parallel ──────────────
    // get_enrollment_counts uses a single GROUP BY query — one round-trip for all challenges.
    const [userEnrollRes, userSubmitRes, countsRes] = await Promise.all([
      user
        ? admin
            .from("challenge_enrollments")
            .select("challenge_id")
            .eq("user_id", user.id)
            .in("challenge_id", challengeIds)
        : Promise.resolve({ data: [] }),
      user
        ? admin
            .from("challenge_submissions")
            .select("challenge_id")
            .eq("user_id", user.id)
            .in("challenge_id", challengeIds)
        : Promise.resolve({ data: [] }),
      admin.rpc("get_enrollment_counts", { challenge_ids: challengeIds }),
    ]);

    enrollmentSet = new Set((userEnrollRes.data ?? []).map((e) => e.challenge_id));
    submittedSet = new Set((userSubmitRes.data ?? []).map((s) => s.challenge_id));
    for (const row of (countsRes.data ?? []) as { challenge_id: string; count: number }[]) {
      enrollmentCounts[row.challenge_id] = row.count;
    }
  }

  const cards: ChallengeCard[] = (challengesRes.data ?? []).map((challenge) => ({
    ...challenge,
    tags: challenge.tags ?? [],
    start_at: challenge.start_at,
    difficulty: (challenge.difficulty ?? null) as ChallengeCard["difficulty"],
    enrollment_count: enrollmentCounts[challenge.id] ?? 0,
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
      {isAuthenticated && isProfileComplete && role === "member" ? (
        <p className="mt-3 text-sm" style={{ color: "var(--ds-text-muted)" }}>
          <Link
            href="/dashboard/challenges/propose"
            className="font-medium text-[var(--ds-accent)] underline-offset-4 hover:underline"
          >
            Propose a challenge
          </Link>{" "}
          — submissions are reviewed before going live.
        </p>
      ) : null}
      <ChallengesList
        active={active}
        archived={archived}
        access={{ isAuthenticated, isProfileComplete, isAdmin: role === "admin" || role === "super_admin" }}
        locale={locale}
      />
    </div>
  );
}
