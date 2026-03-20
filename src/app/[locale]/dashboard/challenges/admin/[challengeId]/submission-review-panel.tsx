"use client";

import { useMemo, useState, useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/client";
import { reviewChallengeSubmission } from "@/lib/challenges/edge-functions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Submission = {
  id: string;
  user_id: string;
  status: "draft" | "submitted" | "under_review" | "accepted" | "rejected" | "withdrawn";
  submission_url: string | null;
  submission_text: string | null;
  review_decision_text: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export function SubmissionReviewPanel({
  challengeId,
  submissions,
  statusFilter,
  currentPage,
  pageSize,
  totalSubmissions,
  stats,
}: {
  challengeId: string;
  submissions: Array<Record<string, unknown>>;
  statusFilter: "all" | Submission["status"];
  currentPage: number;
  pageSize: number;
  totalSubmissions: number;
  stats: Record<string, number>;
}) {
  const [decisionText, setDecisionText] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();
  const router = useRouter();

  const typedSubmissions = useMemo(() => submissions as unknown as Submission[], [submissions]);
  const totalPages = Math.max(1, Math.ceil(totalSubmissions / pageSize));

  function updateQuery(next: { status?: string; page?: number }) {
    const nextStatus = next.status ?? statusFilter;
    const nextPage = next.page ?? currentPage;
    const params = new URLSearchParams();
    if (nextStatus !== "all") params.set("status", nextStatus);
    if (nextPage > 1) params.set("page", String(nextPage));
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  function handleReview(submissionId: string, status: "under_review" | "accepted" | "rejected") {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        const supabase = createClient();
        await reviewChallengeSubmission(supabase, {
          submission_id: submissionId,
          status,
          review_decision_text: decisionText[submissionId]?.trim() || `Status updated to ${status}`,
        });
        setSuccess(`Submission updated: ${status}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to review submission");
      }
    });
  }

  return (
    <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-4">
      <h2 className="text-lg font-medium text-white">Submission Review</h2>
      <p className="mt-1 text-sm text-white/70">
        Challenge ID: {challengeId}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
        <div className="rounded-md border border-white/10 bg-white/5 p-2">
          <p className="text-[11px] text-white/60">Submitted</p>
          <p className="text-sm font-semibold text-white">{stats.submitted ?? 0}</p>
        </div>
        <div className="rounded-md border border-white/10 bg-white/5 p-2">
          <p className="text-[11px] text-white/60">Under Review</p>
          <p className="text-sm font-semibold text-white">{stats.under_review ?? 0}</p>
        </div>
        <div className="rounded-md border border-white/10 bg-white/5 p-2">
          <p className="text-[11px] text-white/60">Accepted</p>
          <p className="text-sm font-semibold text-white">{stats.accepted ?? 0}</p>
        </div>
        <div className="rounded-md border border-white/10 bg-white/5 p-2">
          <p className="text-[11px] text-white/60">Rejected</p>
          <p className="text-sm font-semibold text-white">{stats.rejected ?? 0}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label className="text-xs text-white/70">Filter status:</label>
        <select
          value={statusFilter}
          onChange={(e) => {
            updateQuery({
              status: e.target.value as "all" | Submission["status"],
              page: 1,
            });
          }}
          className="rounded-md border border-white/20 bg-white/5 px-2 py-1 text-xs text-white"
        >
          <option value="all">All</option>
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
          <option value="under_review">Under Review</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
          <option value="withdrawn">Withdrawn</option>
        </select>
        <p className="text-xs text-white/60">
          Showing {typedSubmissions.length} of {totalSubmissions}
        </p>
      </div>

      <div className="mt-4 space-y-4">
        {typedSubmissions.map((raw) => {
          const submission = raw as unknown as Submission;
          return (
            <div key={submission.id} className="rounded-lg border border-white/10 p-3">
              <p className="text-sm text-white/80">
                User: <span className="font-mono text-xs">{submission.user_id}</span>
              </p>
              <p className="text-xs text-white/60">Status: {submission.status}</p>
              {submission.submission_url ? (
                <a
                  href={submission.submission_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block text-sm text-blue-300 underline"
                >
                  View submission URL
                </a>
              ) : null}
              {submission.submission_text ? (
                <p className="mt-2 whitespace-pre-wrap text-sm text-white/70">{submission.submission_text}</p>
              ) : null}

              <Textarea
                className="mt-3 border-white/20 bg-white/5 text-white"
                placeholder="Review decision text"
                value={decisionText[submission.id] ?? submission.review_decision_text ?? ""}
                onChange={(e) =>
                  setDecisionText((prev) => ({
                    ...prev,
                    [submission.id]: e.target.value,
                  }))
                }
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full border-white/20 text-white hover:bg-white/10"
                  disabled={isPending}
                  onClick={() => handleReview(submission.id, "under_review")}
                >
                  Mark Under Review
                </Button>
                <Button
                  size="sm"
                  className="rounded-full"
                  disabled={isPending}
                  onClick={() => handleReview(submission.id, "accepted")}
                >
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full border-white/20 text-white hover:bg-white/10"
                  disabled={isPending}
                  onClick={() => handleReview(submission.id, "rejected")}
                >
                  Reject
                </Button>
              </div>
            </div>
          );
        })}
        {typedSubmissions.length === 0 ? (
          <p className="rounded-lg border border-white/10 p-4 text-sm text-white/60">
            No submissions found for the selected filter.
          </p>
        ) : null}
      </div>

      {totalSubmissions > 0 ? (
        <div className="mt-4 flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="rounded-full border-white/20 text-white hover:bg-white/10"
            disabled={currentPage <= 1}
            onClick={() => updateQuery({ page: Math.max(1, currentPage - 1) })}
          >
            Previous
          </Button>
          <p className="text-xs text-white/70">
            Page {currentPage} of {totalPages}
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="rounded-full border-white/20 text-white hover:bg-white/10"
            disabled={currentPage >= totalPages}
            onClick={() => updateQuery({ page: Math.min(totalPages, currentPage + 1) })}
          >
            Next
          </Button>
        </div>
      ) : null}

      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
      {success ? <p className="mt-3 text-sm text-emerald-400">{success}</p> : null}
    </div>
  );
}
