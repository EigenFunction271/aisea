"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { upsertChallengeSubmission } from "@/lib/challenges/edge-functions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type Submission = {
  project_name: string | null;
  submission_url: string | null;
  submission_text: string | null;
  repo_link: string | null;
  status: string;
  submission_files: Array<{ path: string; mime_type: string; size_bytes: number }>;
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

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

const MONO: React.CSSProperties = {
  fontFamily: "var(--font-dm-mono), monospace",
};

const FIELD_LABEL: React.CSSProperties = {
  ...MONO,
  fontSize: 11,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  color: "var(--ds-text-muted)",
  display: "block",
  marginBottom: 6,
};

export function SubmissionModal({
  isOpen,
  onClose,
  challengeId,
  challengeTitle,
  initialSubmission,
  canSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  challengeId: string;
  challengeTitle: string;
  initialSubmission: Submission | null;
  canSubmit: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [projectName, setProjectName] = useState(initialSubmission?.project_name ?? "");
  const [demoLink, setDemoLink] = useState(initialSubmission?.submission_url ?? "");
  const [writeUp, setWriteUp] = useState(initialSubmission?.submission_text ?? "");
  const [repoLink, setRepoLink] = useState(initialSubmission?.repo_link ?? "");
  const [files, setFiles] = useState<Array<{ path: string; mime_type: string; size_bytes: number }>>(
    initialSubmission?.submission_files ?? []
  );
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const words = wordCount(writeUp);
  const disabled = !canSubmit;

  function handleClose() {
    if (submitted) router.refresh();
    onClose();
  }

  async function handleUpload(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setError(null);
    startTransition(async () => {
      try {
        const supabase = createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) throw new Error("Not signed in");

        const uploaded: typeof files = [];
        for (const file of Array.from(fileList)) {
          if (!ALLOWED_MIME_TYPES.has(file.type))
            throw new Error(`Unsupported type: ${file.type || "unknown"}`);
          if (file.size > MAX_FILE_SIZE_BYTES)
            throw new Error(`File too large (max 5 MB): ${file.name}`);
          const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
          const path = `${user.id}/${challengeId}/${crypto.randomUUID()}-${safeName}`;
          const { error: uploadError } = await supabase.storage
            .from("challenge-submissions")
            .upload(path, file, { upsert: false, contentType: file.type });
          if (uploadError) throw new Error(uploadError.message ?? "Upload failed");
          uploaded.push({ path, mime_type: file.type, size_bytes: file.size });
        }
        setFiles((prev) => [...prev, ...uploaded].slice(0, 5));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
      }
    });
  }

  function save(nextStatus: "draft" | "submitted" | "withdrawn") {
    setError(null);

    if (nextStatus === "submitted") {
      if (!demoLink.trim()) {
        setError("Demo link is required.");
        return;
      }
      if (words < 100) {
        setError(`Write-up must be at least 100 words (currently ${words}).`);
        return;
      }
    }

    startTransition(async () => {
      try {
        const supabase = createClient();
        await upsertChallengeSubmission(supabase, {
          challenge_id: challengeId,
          status: nextStatus,
          project_name: projectName.trim() || null,
          submission_url: demoLink.trim() || null,
          submission_text: writeUp.trim() || null,
          repo_link: repoLink.trim() || null,
          submission_files: files,
        });
        if (nextStatus === "submitted") setSubmitted(true);
        else {
          setError(null);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save");
      }
    });
  }

  const btnBase = "rounded-full font-[family-name:var(--font-dm-mono)] text-xs tracking-wider";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto border-white/10 bg-[var(--ds-bg-surface)] text-white sm:max-w-xl"
        style={{ borderColor: "var(--ds-border)" }}
      >
        <DialogHeader>
          <DialogTitle
            style={{ fontFamily: "var(--font-syne), sans-serif", color: "var(--ds-text-primary)" }}
          >
            {submitted ? "Submission sent ✓" : `Submit to: ${challengeTitle}`}
          </DialogTitle>
        </DialogHeader>

        {submitted ? (
          <div style={{ padding: "12px 0" }}>
            <p style={{ fontSize: 14, color: "var(--ds-text-secondary)", marginBottom: 20 }}>
              Your submission has been recorded. The review panel will be updated shortly.
            </p>
            <Button onClick={handleClose} className={btnBase}>
              Close
            </Button>
          </div>
        ) : (
          <div className="space-y-5 py-2">
            {/* Project name */}
            <div>
              <label style={FIELD_LABEL}>Project name</label>
              <Input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="My AI project"
                disabled={disabled || isPending}
                className="border-white/20 bg-white/5 text-white placeholder:text-white/30"
              />
            </div>

            {/* Demo link (required) */}
            <div>
              <label style={FIELD_LABEL}>
                Demo link <span style={{ color: "#f87171" }}>*</span>
              </label>
              <Input
                type="url"
                value={demoLink}
                onChange={(e) => setDemoLink(e.target.value)}
                placeholder="https://demo.example.com"
                disabled={disabled || isPending}
                className="border-white/20 bg-white/5 text-white placeholder:text-white/30"
              />
            </div>

            {/* Write-up (required, min 100 words) */}
            <div>
              <label style={FIELD_LABEL}>
                Write-up <span style={{ color: "#f87171" }}>*</span>
                <span style={{ color: words >= 100 ? "#4ade80" : "var(--ds-text-muted)", marginLeft: 8 }}>
                  {words} / 100 words
                </span>
              </label>
              <Textarea
                value={writeUp}
                onChange={(e) => setWriteUp(e.target.value)}
                placeholder="What you built, what you learned, what you'd do differently…"
                rows={7}
                disabled={disabled || isPending}
                className="border-white/20 bg-white/5 text-white placeholder:text-white/30"
              />
            </div>

            {/* Repo link (optional) */}
            <div>
              <label style={FIELD_LABEL}>
                Repo / source{" "}
                <span style={{ ...MONO, fontSize: 10, color: "var(--ds-text-muted)" }}>
                  (optional)
                </span>
              </label>
              <Input
                type="url"
                value={repoLink}
                onChange={(e) => setRepoLink(e.target.value)}
                placeholder="https://github.com/…"
                disabled={disabled || isPending}
                className="border-white/20 bg-white/5 text-white placeholder:text-white/30"
              />
            </div>

            {/* File uploads (optional) */}
            <div>
              <label style={FIELD_LABEL}>
                Attachments{" "}
                <span style={{ ...MONO, fontSize: 10, color: "var(--ds-text-muted)" }}>
                  (optional, max 5 × 5 MB)
                </span>
              </label>
              <Input
                type="file"
                multiple
                disabled={disabled || isPending || files.length >= 5}
                onChange={(e) => handleUpload(e.target.files)}
                className="border-white/20 bg-white/5 text-white"
              />
              {files.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {files.map((f) => (
                    <li key={f.path} className="flex items-center justify-between text-xs text-white/60">
                      <span className="truncate pr-2">{f.path.split("/").pop()} ({formatBytes(f.size_bytes)})</span>
                      <button
                        type="button"
                        className="text-white/40 hover:text-white/80"
                        onClick={() => setFiles((prev) => prev.filter((x) => x.path !== f.path))}
                        disabled={disabled || isPending}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Closed notice */}
            {!canSubmit && (
              <p
                style={{
                  ...MONO,
                  fontSize: 12,
                  color: "#fbbf24",
                  background: "rgba(251,191,36,0.08)",
                  border: "1px solid rgba(251,191,36,0.25)",
                  borderRadius: 6,
                  padding: "8px 12px",
                }}
              >
                Submissions are closed — viewing only.
              </p>
            )}

            {error && <p className="text-sm text-red-400">{error}</p>}

            {/* Action buttons */}
            {canSubmit && (
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  onClick={() => save("submitted")}
                  disabled={isPending}
                  className={`${btnBase} bg-[var(--ds-accent)] text-[#0a0a0a] hover:opacity-90`}
                >
                  {isPending ? "Saving…" : "Submit"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => save("draft")}
                  disabled={isPending}
                  className={`${btnBase} border-white/20 text-white hover:bg-white/10`}
                >
                  Save draft
                </Button>
                {initialSubmission && (
                  <Button
                    variant="ghost"
                    onClick={() => save("withdrawn")}
                    disabled={isPending}
                    className={`${btnBase} text-white/40 hover:text-white/70`}
                  >
                    Withdraw
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
