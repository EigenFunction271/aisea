import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ChallengeForm } from "../challenge-form";
import { SubmissionReviewPanel } from "./submission-review-panel";

type SubmissionStatus = "draft" | "submitted" | "under_review" | "accepted" | "rejected" | "withdrawn";

export default async function EditChallengePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; challengeId: string }>;
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { locale, challengeId } = await params;
  const { status, page } = await searchParams;
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=/${locale}/dashboard/challenges/admin/${challengeId}`);

  // get_profile_role is SECURITY DEFINER — callable from the user-scoped client.
  const { data: roleData } = await supabase.rpc("get_profile_role", { target_user_id: user.id });
  const role = roleData as string | null;
  if (role !== "admin" && role !== "super_admin") {
    redirect(`/${locale}/dashboard/challenges`);
  }

  const { data: challenge } = await admin
    .from("challenges")
    .select(
      "id, title, subtitle, description, hero_image_url, host_name, org_name, start_at, end_at, timezone, reward_text, external_link, status, tags, attachments, eligibility, judging_rubric, difficulty, winners, created_by"
    )
    .eq("id", challengeId)
    .maybeSingle();
  if (!challenge) notFound();
  if (
    role === "admin" &&
    challenge.created_by !== user.id &&
    challenge.status !== "pending_review"
  ) {
    notFound();
  }

  const allowedStatuses = new Set([
    "draft",
    "submitted",
    "under_review",
    "accepted",
    "rejected",
    "withdrawn",
  ]);
  const statusFilter = (
    status && allowedStatuses.has(status) ? status : "all"
  ) as "all" | SubmissionStatus;
  const currentPage = Math.max(1, Number.parseInt(page ?? "1", 10) || 1);
  const pageSize = 8;
  const from = (currentPage - 1) * pageSize;
  const to = from + pageSize - 1;

  let submissionCountQuery = admin
    .from("challenge_submissions")
    .select("id", { count: "exact", head: true })
    .eq("challenge_id", challengeId);
  if (statusFilter !== "all") {
    submissionCountQuery = submissionCountQuery.eq("status", statusFilter);
  }
  const statusBuckets: SubmissionStatus[] = [
    "submitted",
    "under_review",
    "accepted",
    "rejected",
  ];
  const [submissionCountResult, ...statusCountResults] = await Promise.all([
    submissionCountQuery,
    ...statusBuckets.map((bucket) =>
      admin
        .from("challenge_submissions")
        .select("id", { count: "exact", head: true })
        .eq("challenge_id", challengeId)
        .eq("status", bucket)
    ),
  ]);
  const totalSubmissions = submissionCountResult.count ?? 0;
  const submissionStats = statusBuckets.reduce<Record<string, number>>((acc, bucket, index) => {
    acc[bucket] = statusCountResults[index]?.count ?? 0;
    return acc;
  }, {});

  let submissionQuery = admin
    .from("challenge_submissions")
    .select("id, user_id, status, submission_url, submission_text, review_decision_text, reviewed_at, created_at")
    .eq("challenge_id", challengeId)
    .range(from, to)
    .order("created_at", { ascending: false });

  if (statusFilter !== "all") {
    submissionQuery = submissionQuery.eq("status", statusFilter);
  }

  const { data: submissions } = await submissionQuery;

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-2xl font-semibold text-white">Manage Challenge</h1>
      <p className="mt-2 text-sm text-white/70">
        Update challenge metadata, status transitions, winners, and review participant submissions.
      </p>
      {challenge.status === "pending_review" ? (
        <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          This challenge is a <strong>community proposal</strong>. Use <strong>Publish</strong> to make it
          visible to everyone, or <strong>Unpublish</strong> to return it to draft (rejected).
        </p>
      ) : null}

        <ChallengeForm
          mode="edit"
          initial={{
            id: challenge.id,
            title: challenge.title,
            subtitle: challenge.subtitle,
            description: challenge.description,
            hero_image_url: challenge.hero_image_url,
            host_name: challenge.host_name,
            org_name: challenge.org_name,
            start_at: challenge.start_at,
            end_at: challenge.end_at,
            timezone: challenge.timezone,
            reward_text: challenge.reward_text,
            external_link: challenge.external_link,
            status: challenge.status,
            tags: challenge.tags ?? [],
            attachments: challenge.attachments ?? [],
            eligibility: challenge.eligibility,
            judging_rubric: challenge.judging_rubric,
            difficulty: (challenge.difficulty ?? null) as "starter" | "builder" | "hardcore" | null,
            winners: challenge.winners ?? [],
          }}
        />

        <SubmissionReviewPanel
          challengeId={challenge.id}
          submissions={(submissions ?? []) as Array<Record<string, unknown>>}
          statusFilter={statusFilter}
          currentPage={currentPage}
          pageSize={pageSize}
          totalSubmissions={totalSubmissions}
          stats={submissionStats}
        />
    </div>
  );
}
