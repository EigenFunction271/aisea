import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DashboardContent } from "./dashboard-content";
import { routing } from "@/i18n/routing";
import type { LiveChallenge, ActivityItem } from "./dashboard-types";

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
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=/${locale}/dashboard`);

  // ── Builder profile ──────────────────────────────────────────────────────
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
      builder = { ...b, skills: (b.skills ?? []) as string[], project_count: count ?? 0 };
    }
  }

  // ── Live challenges (up to 3) ────────────────────────────────────────────
  const { data: rawChallenges } = await admin
    .from("challenges")
    .select("id, title, subtitle, hero_image_url, end_at, reward_text")
    .eq("status", "published")
    .order("start_at", { ascending: false })
    .limit(3);

  const challengeIds = (rawChallenges ?? []).map((c) => c.id);

  // Enrollment + submission state and counts in parallel
  const [enrollRes, submitRes, enrollCountRes] = await Promise.all([
    challengeIds.length
      ? admin.from("challenge_enrollments").select("challenge_id").eq("user_id", user.id).in("challenge_id", challengeIds)
      : Promise.resolve({ data: [] }),
    challengeIds.length
      ? admin.from("challenge_submissions").select("challenge_id").eq("user_id", user.id).in("challenge_id", challengeIds)
      : Promise.resolve({ data: [] }),
    challengeIds.length
      ? admin.from("challenge_enrollments").select("challenge_id").in("challenge_id", challengeIds)
      : Promise.resolve({ data: [] }),
  ]);

  const enrolledSet = new Set((enrollRes.data ?? []).map((e) => e.challenge_id));
  const submittedSet = new Set((submitRes.data ?? []).map((s) => s.challenge_id));
  const enrollmentCounts: Record<string, number> = {};
  for (const id of challengeIds) {
    enrollmentCounts[id] = (enrollCountRes.data ?? []).filter((e) => e.challenge_id === id).length;
  }

  const liveChallenges: LiveChallenge[] = (rawChallenges ?? []).map((c) => ({
    id: c.id,
    title: c.title,
    subtitle: c.subtitle,
    hero_image_url: c.hero_image_url,
    end_at: c.end_at,
    reward_text: c.reward_text,
    enrollment_state: submittedSet.has(c.id) ? "submitted" : enrolledSet.has(c.id) ? "enrolled" : "not_enrolled",
    enrollment_count: enrollmentCounts[c.id] ?? 0,
  }));

  // ── Recent activity (up to 5 items) ─────────────────────────────────────
  const [enrollActivity, submitActivity] = await Promise.all([
    admin
      .from("challenge_enrollments")
      .select("id, challenge_id, enrolled_at, challenges(title)")
      .eq("user_id", user.id)
      .order("enrolled_at", { ascending: false })
      .limit(8),
    admin
      .from("challenge_submissions")
      .select("id, challenge_id, submitted_at, challenges(title)")
      .eq("user_id", user.id)
      .not("submitted_at", "is", null)
      .order("submitted_at", { ascending: false })
      .limit(8),
  ]);

  const activityItems: ActivityItem[] = [
    ...(enrollActivity.data ?? []).map((e) => ({
      id: `enroll-${e.id}`,
      type: "enrolled" as const,
      challengeTitle: (e.challenges as unknown as { title: string } | null)?.title ?? "a challenge",
      challengeId: e.challenge_id,
      timestamp: e.enrolled_at as string,
    })),
    ...(submitActivity.data ?? [])
      .filter((s) => s.submitted_at)
      .map((s) => ({
        id: `submit-${s.id}`,
        type: "submitted" as const,
        challengeTitle: (s.challenges as unknown as { title: string } | null)?.title ?? "a challenge",
        challengeId: s.challenge_id,
        timestamp: s.submitted_at as string,
      })),
  ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  return (
    <DashboardContent
      builder={builder}
      userEmail={user.email ?? null}
      memberSince={user.created_at}
      locale={locale}
      liveChallenges={liveChallenges}
      activityItems={activityItems}
    />
  );
}
