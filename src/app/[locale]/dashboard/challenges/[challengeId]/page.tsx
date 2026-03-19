import { notFound } from "next/navigation";
import { Link } from "@/i18n/routing";
import { Navbar1 } from "@/components/ui/navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SubmissionPanel } from "./submission-panel";

async function getProfileCompleteState(userId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("is_profile_complete_for_challenges", {
    target_user_id: userId,
  });
  if (error) return false;
  return data === true;
}

export default async function ChallengeDetailPage({
  params,
}: {
  params: Promise<{ locale: string; challengeId: string }>;
}) {
  const { locale, challengeId } = await params;
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthenticated = Boolean(user);
  const isProfileComplete = user ? await getProfileCompleteState(user.id) : false;
  const isLocked = !(isAuthenticated && isProfileComplete);

  const { data: challenge } = await admin
    .from("challenges")
    .select("*")
    .eq("id", challengeId)
    .in("status", ["published", "archived"])
    .maybeSingle();

  if (!challenge) notFound();

  let enrollmentExists = false;
  let submission: {
    status: "draft" | "submitted" | "under_review" | "accepted" | "rejected" | "withdrawn";
    submission_url: string | null;
    submission_text: string | null;
    submission_files?: Array<{ path: string; mime_type: string; size_bytes: number }>;
  } | null = null;

  if (user) {
    const [{ data: enrollment }, { data: submissionRow }] = await Promise.all([
      admin
        .from("challenge_enrollments")
        .select("id")
        .eq("challenge_id", challenge.id)
        .eq("user_id", user.id)
        .maybeSingle(),
      admin
        .from("challenge_submissions")
        .select("status, submission_url, submission_text, submission_files")
        .eq("challenge_id", challenge.id)
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    enrollmentExists = Boolean(enrollment);
    submission = submissionRow ?? null;
  }

  const canSubmit = challenge.status === "published";
  const loginHref = `/${locale}/login?next=/${locale}/dashboard/challenges/${challengeId}`;
  const unlockHref = isAuthenticated ? "/dashboard/create-profile" : loginHref;

  return (
    <main className="min-h-screen bg-black">
      <Navbar1 />
      <div className="mx-auto max-w-4xl px-4 pb-16 pt-24">
        <div className="mb-4">
          <Button asChild variant="ghost" className="rounded-full text-white/70 hover:bg-white/10 hover:text-white">
            <Link href="/dashboard/challenges">← Back to challenges</Link>
          </Button>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <div className={`h-44 w-full rounded-lg bg-white/10 ${isLocked ? "blur-md" : ""}`} />
          <h1 className={`mt-4 text-2xl font-semibold text-white ${isLocked ? "blur-sm" : ""}`}>{challenge.title}</h1>
          <p className={`mt-2 text-white/70 ${isLocked ? "blur-sm" : ""}`}>{challenge.subtitle}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="secondary">{challenge.status}</Badge>
            <Badge variant="outline" className="border-white/20 text-white/80">
              Ends {new Date(challenge.end_at).toLocaleString()}
            </Badge>
            <Badge variant="outline" className="border-white/20 text-white/80">
              Reward: {challenge.reward_text}
            </Badge>
            {challenge.status !== "published" ? (
              <Badge variant="outline" className="border-amber-400/40 text-amber-300">
                Submissions closed
              </Badge>
            ) : null}
          </div>

          <div className={`mt-4 whitespace-pre-wrap text-sm text-white/80 ${isLocked ? "blur-sm" : ""}`}>
            {challenge.description}
          </div>

          {!isLocked ? (
            <div className="mt-6 space-y-4">
              <section className="rounded-lg border border-white/10 p-4">
                <h2 className="text-sm font-medium text-white">Eligibility</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm text-white/70">{challenge.eligibility}</p>
              </section>
              <section className="rounded-lg border border-white/10 p-4">
                <h2 className="text-sm font-medium text-white">Judging rubric</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm text-white/70">{challenge.judging_rubric}</p>
              </section>
            </div>
          ) : null}
        </div>

        {isLocked ? (
          <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-white/70">
              Challenge details are visible in preview mode. Sign in and complete your profile to enroll and submit.
            </p>
            <Button asChild className="mt-3 rounded-full">
              <Link href={unlockHref}>{isAuthenticated ? "Complete profile" : "Sign in"}</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-5">
            {challenge.status !== "published" ? (
              <p className="mb-3 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-sm text-amber-200">
                This challenge is closed for submissions. You can still view your submission history.
              </p>
            ) : null}
            <SubmissionPanel
              challengeId={challenge.id}
              isLocked={isLocked}
              isEnrolled={enrollmentExists}
              canSubmit={canSubmit}
              initialSubmission={submission}
            />
          </div>
        )}
      </div>
    </main>
  );
}
