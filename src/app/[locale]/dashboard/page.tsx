// Dashboard home: live challenges change only on admin action; cache for 60 s.
export const revalidate = 60;

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCachedBuilderProfile } from "@/lib/queries/builder-profile";
import { DashboardContent } from "./dashboard-content";
import { routing } from "@/i18n/routing";
import type { LiveChallenge, ActivityItem } from "./dashboard-types";

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

  // ── Phase 1: profile + challenges + activity in parallel ─────────────────
  const [profile, challengesRes, enrollActivityRes, submitActivityRes] = await Promise.all([
    getCachedBuilderProfile(user.id),

    admin
      .from("challenges")
      .select("id, title, subtitle, hero_image_url, end_at, reward_text")
      .eq("status", "published")
      .order("start_at", { ascending: false })
      .limit(3),

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

  const challengeIds = (challengesRes.data ?? []).map((c) => c.id);

  // ── Phase 2: per-user enrollment state + counts (parallel) ───────────────
  // Counts use count:exact/head:true to avoid fetching rows into memory.
  const [projectCountRes, enrollRes, submitRes, enrollCountResults] = await Promise.all([
    profile
      ? supabase
          .from("projects")
          .select("id", { count: "exact", head: true })
          .eq("builder_id", profile.id)
      : Promise.resolve({ count: 0 }),
    challengeIds.length
      ? admin
          .from("challenge_enrollments")
          .select("challenge_id")
          .eq("user_id", user.id)
          .in("challenge_id", challengeIds)
      : Promise.resolve({ data: [] }),
    challengeIds.length
      ? admin
          .from("challenge_submissions")
          .select("challenge_id")
          .eq("user_id", user.id)
          .in("challenge_id", challengeIds)
      : Promise.resolve({ data: [] }),
    challengeIds.length
      ? admin.rpc("get_enrollment_counts", { challenge_ids: challengeIds })
      : Promise.resolve({ data: [] }),
  ]);

  const builder = profile
    ? {
        ...profile,
        project_count: (projectCountRes as { count: number | null }).count ?? 0,
      }
    : null;

  const enrolledSet = new Set((enrollRes.data ?? []).map((e) => e.challenge_id));
  const submittedSet = new Set((submitRes.data ?? []).map((s) => s.challenge_id));
  const enrollCountData = enrollCountResults as unknown as { data: { challenge_id: string; count: number }[] | null };
  const enrollmentCounts = Object.fromEntries(
    (enrollCountData.data ?? []).map((r) => [r.challenge_id, r.count])
  );

  const liveChallenges: LiveChallenge[] = (challengesRes.data ?? []).map((c) => ({
    id: c.id,
    title: c.title,
    subtitle: c.subtitle,
    hero_image_url: c.hero_image_url,
    end_at: c.end_at,
    reward_text: c.reward_text,
    enrollment_state: submittedSet.has(c.id) ? "submitted" : enrolledSet.has(c.id) ? "enrolled" : "not_enrolled",
    enrollment_count: enrollmentCounts[c.id] ?? 0,
  }));

  const activityItems: ActivityItem[] = [
    ...(enrollActivityRes.data ?? []).map((e) => ({
      id: `enroll-${e.id}`,
      type: "enrolled" as const,
      challengeTitle: (e.challenges as unknown as { title: string } | null)?.title ?? "a challenge",
      challengeId: e.challenge_id,
      timestamp: e.enrolled_at as string,
    })),
    ...(submitActivityRes.data ?? [])
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
