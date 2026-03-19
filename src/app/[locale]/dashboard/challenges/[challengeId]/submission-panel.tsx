"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { enrollInChallenge, upsertChallengeSubmission } from "@/lib/challenges/edge-functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Submission = {
  status: "draft" | "submitted" | "under_review" | "accepted" | "rejected" | "withdrawn";
  submission_url: string | null;
  submission_text: string | null;
  submission_files?: Array<{ path: string; mime_type: string; size_bytes: number }>;
};

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "text/plain",
  "application/zip",
]);

export function SubmissionPanel({
  challengeId,
  isLocked,
  isEnrolled,
  canSubmit,
  initialSubmission,
}: {
  challengeId: string;
  isLocked: boolean;
  isEnrolled: boolean;
  canSubmit: boolean;
  initialSubmission: Submission | null;
}) {
  const [url, setUrl] = useState(initialSubmission?.submission_url ?? "");
  const [text, setText] = useState(initialSubmission?.submission_text ?? "");
  const [status, setStatus] = useState<"draft" | "submitted" | "withdrawn">(
    initialSubmission?.status === "submitted" ? "submitted" : "draft"
  );
  const [submissionFiles, setSubmissionFiles] = useState<
    Array<{ path: string; mime_type: string; size_bytes: number }>
  >(initialSubmission?.submission_files ?? []);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isEnrolledLocal, setIsEnrolledLocal] = useState(isEnrolled);

  const disabled = isLocked || !canSubmit;

  function handleEnroll() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        const supabase = createClient();
        await enrollInChallenge(supabase, challengeId);
        setIsEnrolledLocal(true);
        setSuccess("Enrolled. You can now save a draft or submit.");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to enroll");
      }
    });
  }

  function handleSave(nextStatus: "draft" | "submitted" | "withdrawn") {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        const supabase = createClient();
        await upsertChallengeSubmission(supabase, {
          challenge_id: challengeId,
          status: nextStatus,
          submission_url: url.trim() || null,
          submission_text: text.trim() || null,
          submission_files: submissionFiles,
        });
        setStatus(nextStatus);
        setSuccess(nextStatus === "submitted" ? "Submission sent." : "Draft saved.");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save submission");
      }
    });
  }

  function formatBytes(size: number) {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  function handleRemoveFile(path: string) {
    setSubmissionFiles((prev) => prev.filter((file) => file.path !== path));
  }

  function handleUploadFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          throw new Error("You must be signed in to upload files.");
        }

        const uploaded: Array<{ path: string; mime_type: string; size_bytes: number }> = [];
        for (const file of Array.from(fileList)) {
          if (!ALLOWED_MIME_TYPES.has(file.type)) {
            throw new Error(`Unsupported file type: ${file.type || "unknown"}`);
          }
          if (file.size > MAX_FILE_SIZE_BYTES) {
            throw new Error(`File exceeds 5MB limit: ${file.name}`);
          }

          const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
          const path = `${user.id}/${challengeId}/${crypto.randomUUID()}-${safeName}`;
          const { error: uploadError } = await supabase.storage
            .from("challenge-submissions")
            .upload(path, file, { upsert: false, contentType: file.type });

          if (uploadError) {
            throw new Error(uploadError.message ?? "Failed to upload file");
          }

          uploaded.push({
            path,
            mime_type: file.type,
            size_bytes: file.size,
          });
        }

        setSubmissionFiles((prev) => [...prev, ...uploaded].slice(0, 5));
        setSuccess("File upload complete.");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to upload file");
      }
    });
  }

  if (isLocked) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm text-white/70">
          Sign in and complete your profile to enroll and submit to this challenge.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      {!isEnrolledLocal ? (
        <div className="space-y-3">
          <p className="text-sm text-white/70">Enrollment is required before you can submit.</p>
          <Button onClick={handleEnroll} disabled={isPending || disabled} className="rounded-full">
            {isPending ? "Enrolling..." : "Enroll"}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-white/60">Current status: {status}</p>
          {!canSubmit ? (
            <p className="rounded-md border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
              Submission window is closed for this challenge.
            </p>
          ) : null}
          <div>
            <label className="text-sm text-white/80">Submission URL (preferred)</label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="mt-1 border-white/20 bg-white/5 text-white"
              disabled={disabled}
            />
          </div>
          <div>
            <label className="text-sm text-white/80">Submission notes</label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="mt-1 border-white/20 bg-white/5 text-white"
              placeholder="Describe what you built, tradeoffs, and demo details."
              disabled={disabled}
            />
          </div>
          <div>
            <label className="text-sm text-white/80">Upload files (optional, max 5 files, 5MB each)</label>
            <Input
              type="file"
              multiple
              className="mt-1 border-white/20 bg-white/5 text-white"
              onChange={(e) => handleUploadFiles(e.target.files)}
              disabled={disabled || isPending || submissionFiles.length >= 5}
            />
            {submissionFiles.length > 0 ? (
              <ul className="mt-2 space-y-2 text-xs text-white/70">
                {submissionFiles.map((file) => (
                  <li key={file.path} className="flex items-center justify-between rounded-md border border-white/10 p-2">
                    <span className="truncate pr-2">
                      {file.path.split("/").pop()} ({formatBytes(file.size_bytes)})
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 rounded-full px-2 text-white/80 hover:bg-white/10"
                      onClick={() => handleRemoveFile(file.path)}
                      disabled={disabled || isPending}
                    >
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="rounded-full border-white/20 text-white hover:bg-white/10"
              disabled={isPending || disabled}
              onClick={() => handleSave("draft")}
            >
              Save Draft
            </Button>
            <Button className="rounded-full" disabled={isPending || disabled} onClick={() => handleSave("submitted")}>
              Submit
            </Button>
            <Button
              variant="outline"
              className="rounded-full border-white/20 text-white hover:bg-white/10"
              disabled={isPending || disabled}
              onClick={() => handleSave("withdrawn")}
            >
              Withdraw
            </Button>
          </div>
        </div>
      )}
      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
      {success ? <p className="mt-3 text-sm text-emerald-400">{success}</p> : null}
    </div>
  );
}
