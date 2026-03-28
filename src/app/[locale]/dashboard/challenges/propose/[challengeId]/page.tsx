import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChallengeForm } from "../../admin/challenge-form";

export default async function EditProposedChallengePage({
  params,
}: {
  params: Promise<{ locale: string; challengeId: string }>;
}) {
  const { locale, challengeId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/${locale}/login?next=/${locale}/dashboard/challenges/propose/${challengeId}`);
  }

  const { data: challenge, error } = await supabase
    .from("challenges")
    .select(
      "id, created_by, title, subtitle, description, hero_image_url, host_name, org_name, start_at, end_at, timezone, reward_text, external_link, status, tags, attachments, eligibility, judging_rubric, difficulty, winners"
    )
    .eq("id", challengeId)
    .maybeSingle();

  if (error || !challenge) notFound();
  if (challenge.created_by !== user.id || challenge.status !== "pending_review") {
    redirect(`/${locale}/dashboard/challenges`);
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-2xl font-semibold text-white">Edit your proposal</h1>
      <p className="mt-2 text-sm text-white/70">
        Changes stay in review until an admin publishes or returns the proposal.
      </p>
      <ChallengeForm
        mode="edit"
        variant="proposal"
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
          attachments: (challenge.attachments ?? []) as Array<{ label: string; url: string }>,
          eligibility: challenge.eligibility,
          judging_rubric: challenge.judging_rubric,
          difficulty: (challenge.difficulty ?? null) as "starter" | "builder" | "hardcore" | null,
          winners: (challenge.winners ?? []) as Array<{
            user_id: string;
            placement: string;
            decision_text: string;
          }>,
        }}
      />
    </div>
  );
}
