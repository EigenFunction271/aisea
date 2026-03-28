"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/client";
import { createChallenge, setChallengeWinners, transitionChallenge, updateChallenge } from "@/lib/challenges/edge-functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownRenderer as MarkdownRendererClient } from "../../wiki/_components/markdown-renderer-client";

type ChallengeRecord = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  hero_image_url: string | null;
  host_name: string;
  org_name: string;
  start_at: string;
  end_at: string;
  timezone: string;
  reward_text: string;
  external_link: string | null;
  status: "draft" | "published" | "closed" | "archived" | "pending_review";
  tags: string[];
  attachments: Array<{ label: string; url: string }>;
  eligibility: string;
  judging_rubric: string;
  difficulty: "starter" | "builder" | "hardcore" | null;
  winners: Array<{ user_id: string; placement: string; decision_text: string }>;
};

type WinnerRow = { user_id: string; placement: string; decision_text: string };
const PLACEMENT_SUGGESTIONS = [
  "1st Place",
  "2nd Place",
  "3rd Place",
  "Honorable Mention",
];

function toLocalDatetimeValue(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
}

function fromLocalDatetimeValue(local: string): string | null {
  if (!local) return null;
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

const CHALLENGE_PAYLOAD_KEYS = [
  "title",
  "subtitle",
  "description",
  "hero_image_url",
  "host_name",
  "org_name",
  "start_at",
  "end_at",
  "timezone",
  "reward_text",
  "external_link",
  "tags",
  "attachments",
  "eligibility",
  "judging_rubric",
  "difficulty",
] as const;

/** Shallow diff for partial PATCH; arrays compared by JSON serialization. */
function diffChallengePayload(
  current: Record<string, unknown>,
  baseline: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of CHALLENGE_PAYLOAD_KEYS) {
    const c = current[key];
    const b = baseline[key];
    if (key === "tags" || key === "attachments") {
      if (JSON.stringify(c) !== JSON.stringify(b)) out[key] = c;
    } else if (c !== b) {
      out[key] = c;
    }
  }
  return out;
}

export function ChallengeForm({
  mode,
  initial,
  variant = "admin",
}: {
  mode: "create" | "edit";
  initial?: ChallengeRecord;
  /** Community proposals: submit as pending_review; only staff can publish. */
  variant?: "admin" | "proposal";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const storageKey = useMemo(
    () => `challenge-draft:${mode}:${initial?.id ?? "new"}`,
    [mode, initial?.id]
  );

  const [title, setTitle] = useState(initial?.title ?? "");
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [heroImageUrl, setHeroImageUrl] = useState(initial?.hero_image_url ?? "");
  const [hostName, setHostName] = useState(initial?.host_name ?? "");
  const [orgName, setOrgName] = useState(initial?.org_name ?? "");
  const [startAt, setStartAt] = useState(initial ? toLocalDatetimeValue(initial.start_at) : "");
  const [endAt, setEndAt] = useState(initial ? toLocalDatetimeValue(initial.end_at) : "");
  const [timezone, setTimezone] = useState(initial?.timezone ?? "Asia/Singapore");
  const [rewardText, setRewardText] = useState(initial?.reward_text ?? "");
  const [externalLink, setExternalLink] = useState(initial?.external_link ?? "");
  const [tags, setTags] = useState((initial?.tags ?? []).join(", "));
  const [attachments, setAttachments] = useState(
    (initial?.attachments ?? []).map((a) => `${a.label}|${a.url}`).join("\n")
  );
  const [eligibility, setEligibility] = useState(initial?.eligibility ?? "");
  const [judgingRubric, setJudgingRubric] = useState(initial?.judging_rubric ?? "");
  const [difficulty, setDifficulty] = useState<"starter" | "builder" | "hardcore" | "">(
    initial?.difficulty ?? ""
  );
  const [winnersRows, setWinnersRows] = useState<WinnerRow[]>(
    initial?.winners?.length
      ? initial.winners
      : [{ user_id: "", placement: "1st Place", decision_text: "" }]
  );
  const [preview, setPreview] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  /** Last server-aligned payload for edit mode — used to send PATCH with only changed fields. */
  const lastSavedPayloadRef = useRef<Record<string, unknown> | null>(null);

  function parseAttachments() {
    return attachments
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const pipeIdx = line.indexOf("|");
        const label = pipeIdx !== -1 ? line.slice(0, pipeIdx).trim() : line.trim();
        const url = pipeIdx !== -1 ? line.slice(pipeIdx + 1).trim() : "";
        return { label, url, _raw: line };
      });
  }

  // Builds the payload for a server call. Empty start/end dates are sent as "" for drafts;
  // manage-challenge applies server-side fallbacks so we don't duplicate that logic here.
  function buildPayload({
    attachmentRows,
  }: {
    attachmentRows?: ReturnType<typeof parseAttachments>;
  } = {}) {
    const startIso = fromLocalDatetimeValue(startAt);
    const endIso = fromLocalDatetimeValue(endAt);
    const rows = attachmentRows ?? parseAttachments();

    return {
      title: title.trim(),
      subtitle: subtitle.trim(),
      description: description.trim(),
      hero_image_url: heroImageUrl.trim() || null,
      host_name: hostName.trim(),
      org_name: orgName.trim(),
      start_at: startIso ?? "",
      end_at: endIso ?? "",
      timezone: timezone.trim() || "UTC",
      reward_text: rewardText.trim(),
      external_link: externalLink.trim() || null,
      tags: tags
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      attachments: rows.map(({ label, url }) => ({ label, url })),
      eligibility: eligibility.trim(),
      judging_rubric: judgingRubric.trim(),
      difficulty: (difficulty || null) as "starter" | "builder" | "hardcore" | null,
    };
  }

  useEffect(() => {
    if (mode !== "edit" || !initial) {
      lastSavedPayloadRef.current = null;
      return;
    }
    lastSavedPayloadRef.current = buildPayload() as Record<string, unknown>;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- baseline only when switching challenge
  }, [mode, initial?.id]);

  // Full validation — only enforced before publish, not draft saves.
  function validatePublish(): string | null {
    if (!title.trim()) return "Title is required.";
    if (!subtitle.trim()) return "Subtitle is required.";
    if (!description.trim()) return "Description is required.";
    if (!hostName.trim()) return "Host name is required.";
    if (!orgName.trim()) return "Organization name is required.";
    if (!startAt) return "Start date is required.";
    if (!endAt) return "End date is required.";
    const startMs = new Date(startAt).getTime();
    const endMs = new Date(endAt).getTime();
    if (Number.isNaN(startMs)) return "Start date is not a valid date.";
    if (Number.isNaN(endMs)) return "End date is not a valid date.";
    if (endMs <= startMs) return "End date must be after start date.";
    if (!rewardText.trim()) return "Reward text is required.";
    if (!eligibility.trim()) return "Eligibility is required.";
    if (!judgingRubric.trim()) return "Judging rubric is required.";
    return validateAttachments(parseAttachments());
  }

  // Light validation — always enforced so malformed attachments don't cause opaque server errors.
  function validateAttachments(rows = parseAttachments()): string | null {
    const badAttachment = rows.find((a) => !a.url);
    if (badAttachment) {
      return `Attachment line "${badAttachment._raw}" is missing a URL. Format: Label|https://...`;
    }
    return null;
  }

  function parseWinnersRows() {
    return winnersRows
      .map((row) => ({
        user_id: row.user_id.trim(),
        placement: row.placement.trim(),
        decision_text: row.decision_text.trim(),
      }))
      .filter((row) => row.user_id && row.placement && row.decision_text);
  }

  function validateWinnersRows(): string | null {
    const parsed = parseWinnersRows();
    if (parsed.length === 0) return "At least one complete winner row is required.";

    const userIds = parsed.map((row) => row.user_id);
    const duplicateUsers = userIds.filter((id, idx) => userIds.indexOf(id) !== idx);
    if (duplicateUsers.length > 0) {
      return "Each winner user_id must be unique.";
    }

    const placements = parsed.map((row) => row.placement.toLowerCase());
    const duplicatePlacements = placements.filter((value, idx) => placements.indexOf(value) !== idx);
    if (duplicatePlacements.length > 0) {
      return "Each winner placement should be unique.";
    }

    return null;
  }

  function updateWinner(index: number, patch: Partial<WinnerRow>) {
    setWinnersRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row))
    );
  }

  function addWinnerRow() {
    setWinnersRows((prev) => [...prev, { user_id: "", placement: "", decision_text: "" }]);
  }

  function removeWinnerRow(index: number) {
    setWinnersRows((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  async function handleHeroUpload(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];
    if (!file.type.startsWith("image/")) {
      setError("Hero image must be an image file.");
      return;
    }

    setError(null);
    setSuccess(null);
    setUploadingHero(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("You must be signed in to upload an image.");

      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${user.id}/hero/${crypto.randomUUID()}-${safeName}`;
      const { error: uploadError } = await supabase.storage
        .from("challenge-assets")
        .upload(path, file, { upsert: false, contentType: file.type });
      if (uploadError) throw new Error(uploadError.message ?? "Failed to upload hero image");

      const { data: publicUrlData } = supabase.storage.from("challenge-assets").getPublicUrl(path);
      if (!publicUrlData?.publicUrl) throw new Error("Failed to derive hero image URL");

      setHeroImageUrl(publicUrlData.publicUrl);
      setSuccess("Hero image uploaded.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to upload image");
    } finally {
      setUploadingHero(false);
    }
  }

  function handleAutosave() {
    if (typeof window === "undefined") return;
    const snapshot = {
      title,
      subtitle,
      description,
      heroImageUrl,
      hostName,
      orgName,
      startAt,
      endAt,
      timezone,
      rewardText,
      externalLink,
      tags,
      attachments,
      eligibility,
      judgingRubric,
      difficulty,
      winnersRows: JSON.stringify(winnersRows),
    };
    window.localStorage.setItem(storageKey, JSON.stringify(snapshot));
    setSuccess("Draft autosaved locally.");
  }

  function restoreAutosave() {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      setError("No local draft found.");
      return;
    }
    try {
      const snapshot = JSON.parse(raw) as Record<string, string>;
      setTitle(snapshot.title ?? "");
      setSubtitle(snapshot.subtitle ?? "");
      setDescription(snapshot.description ?? "");
      setHeroImageUrl(snapshot.heroImageUrl ?? "");
      setHostName(snapshot.hostName ?? "");
      setOrgName(snapshot.orgName ?? "");
      setStartAt(snapshot.startAt ?? "");
      setEndAt(snapshot.endAt ?? "");
      setTimezone(snapshot.timezone ?? "Asia/Singapore");
      setRewardText(snapshot.rewardText ?? "");
      setExternalLink(snapshot.externalLink ?? "");
      setTags(snapshot.tags ?? "");
      setAttachments(snapshot.attachments ?? "");
      setEligibility(snapshot.eligibility ?? "");
      setJudgingRubric(snapshot.judgingRubric ?? "");
      setDifficulty((snapshot.difficulty as "starter" | "builder" | "hardcore" | "") ?? "");
      try {
        const parsed = snapshot.winnersRows ? (JSON.parse(snapshot.winnersRows) as WinnerRow[]) : [];
        setWinnersRows(parsed.length ? parsed : [{ user_id: "", placement: "1st Place", decision_text: "" }]);
      } catch {
        setWinnersRows([{ user_id: "", placement: "1st Place", decision_text: "" }]);
      }
      setSuccess("Restored local draft.");
      setError(null);
    } catch {
      setError("Failed to parse local draft.");
    }
  }

  const isProposal = variant === "proposal";

  function runAction(action: "save" | "publish" | "unpublish" | "close" | "archive" | "winners") {
    setError(null);
    setSuccess(null);

    let parsedForSave: ReturnType<typeof parseAttachments> | undefined;

    // Publish requires all fields; draft saves only require valid attachment format.
    // Status transitions (unpublish, close, archive) touch no content fields.
    if (action === "publish") {
      const validationError = validatePublish();
      if (validationError) {
        setError(validationError);
        return;
      }
    } else if (action === "save") {
      parsedForSave = parseAttachments();
      const attachmentError = validateAttachments(parsedForSave);
      if (attachmentError) { setError(attachmentError); return; }
    }

    startTransition(async () => {
      try {
        const supabase = createClient();
        const isDraft = action !== "publish";
        if (mode === "create") {
          if (isProposal) {
            const created = await createChallenge(supabase, {
              ...buildPayload({ attachmentRows: parsedForSave }),
              status: "pending_review",
            });
            setSuccess("Submitted for review. An admin will publish it when approved.");
            router.push("/dashboard/challenges");
            return;
          }
          const created = await createChallenge(supabase, {
            ...buildPayload({ attachmentRows: parsedForSave }),
            status: isDraft ? "draft" : "published",
          });
          setSuccess(action === "publish" ? "Challenge created and published." : "Challenge draft created.");
          router.push(`/dashboard/challenges/admin/${created.challenge.id}`);
          return;
        }

        if (!initial) throw new Error("Missing challenge context");

        if (action === "save") {
          const full = buildPayload({ attachmentRows: parsedForSave }) as Record<string, unknown>;
          const baseline = lastSavedPayloadRef.current;
          if (!baseline) {
            await updateChallenge(supabase, initial.id, full);
          } else {
            const partial = diffChallengePayload(full, baseline);
            if (Object.keys(partial).length === 0) {
              setSuccess("Nothing to save.");
              return;
            }
            await updateChallenge(supabase, initial.id, partial);
          }
          lastSavedPayloadRef.current = buildPayload({ attachmentRows: parsedForSave }) as Record<
            string,
            unknown
          >;
          setSuccess("Challenge saved.");
          return;
        }

        if (action === "winners") {
          const winnerError = validateWinnersRows();
          if (winnerError) throw new Error(winnerError);
          await setChallengeWinners(supabase, initial.id, parseWinnersRows());
          setSuccess("Winners updated.");
          return;
        }

        await transitionChallenge(supabase, initial.id, action);
        setSuccess(`Challenge ${action} successful.`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Action failed");
      }
    });
  }

  const inputCls = "border-white/20 bg-white/5 text-white placeholder:text-white/30";
  const labelCls = "mb-1 block text-xs font-medium text-white/60";

  return (
    <div className="mt-6 space-y-4">
      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-2">
        {isProposal && mode === "create" ? (
          <Button
            type="button"
            className="rounded-full"
            disabled={isPending}
            onClick={() => runAction("publish")}
          >
            Submit for review
          </Button>
        ) : isProposal && mode === "edit" ? (
          <Button
            type="button"
            className="rounded-full"
            disabled={isPending}
            onClick={() => runAction("save")}
          >
            Save changes
          </Button>
        ) : (
          <>
            <Button
              type="button"
              className="rounded-full"
              disabled={isPending}
              onClick={() => runAction("save")}
            >
              {mode === "create" ? "Create Draft" : "Save"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-full border-white/20 text-white hover:bg-white/10"
              disabled={isPending}
              onClick={() => runAction("publish")}
            >
              Publish
            </Button>
          </>
        )}
        {mode === "edit" && !isProposal ? (
          <>
            <Button type="button" variant="outline" className="rounded-full border-white/20 text-white hover:bg-white/10" disabled={isPending} onClick={() => runAction("unpublish")}>
              Unpublish
            </Button>
            <Button type="button" variant="outline" className="rounded-full border-white/20 text-white hover:bg-white/10" disabled={isPending} onClick={() => runAction("close")}>
              Close
            </Button>
            <Button type="button" variant="outline" className="rounded-full border-white/20 text-white hover:bg-white/10" disabled={isPending} onClick={() => runAction("archive")}>
              Archive
            </Button>
          </>
        ) : null}
        <Button type="button" variant="outline" className="rounded-full border-white/20 text-white hover:bg-white/10" onClick={handleAutosave}>
          Autosave
        </Button>
        <Button type="button" variant="outline" className="rounded-full border-white/20 text-white hover:bg-white/10" onClick={restoreAutosave}>
          Restore
        </Button>
        <Button type="button" variant="outline" className="rounded-full border-white/20 text-white hover:bg-white/10" onClick={() => setPreview((p) => !p)}>
          {preview ? "Edit" : "Preview"}
        </Button>
        <Button asChild type="button" variant="ghost" className="rounded-full text-white/70 hover:bg-white/10 hover:text-white">
          <Link href={isProposal ? "/dashboard/challenges" : "/dashboard/challenges/admin"}>Back</Link>
        </Button>
      </div>

      {error ? <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p> : null}
      {success ? <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">{success}</p> : null}

      {preview ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div
            className="h-40 w-full rounded-lg bg-white/10"
            style={
              heroImageUrl
                ? {
                    backgroundImage: `url(${heroImageUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : undefined
            }
          />
          <h2 className="mt-4 text-xl font-semibold text-white">{title || "Untitled challenge"}</h2>
          <p className="mt-2 text-sm text-white/70">{subtitle || "Subtitle preview"}</p>
          <div className="mt-4 text-sm text-white/80">
            <MarkdownRendererClient body={description || "Description preview"} />
          </div>
        </div>
      ) : (
        <div className="space-y-4">

          {/* Row 1: Title + Subtitle */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <label className={labelCls}>Title *</label>
              <Input placeholder="Challenge title" value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <label className={labelCls}>Subtitle *</label>
              <Input placeholder="One-line summary" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* Row 2: Description — full width, tall */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <label className={labelCls}>Description *</label>
            <Textarea
              placeholder="Full challenge description, rules, and context…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`${inputCls} min-h-[240px] resize-y`}
            />
          </div>

          {/* Row 3: Two-column metadata */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Left col: organiser + dates */}
            <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-4">
              <div>
                <label className={labelCls}>Host name *</label>
                <Input placeholder="e.g. Jane Doe" value={hostName} onChange={(e) => setHostName(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Organization *</label>
                <Input placeholder="e.g. Acme Corp" value={orgName} onChange={(e) => setOrgName(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Start date &amp; time *</label>
                <Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>End date &amp; time *</label>
                <Input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Timezone</label>
                <Input placeholder="e.g. Asia/Singapore" value={timezone} onChange={(e) => setTimezone(e.target.value)} className={inputCls} />
              </div>
            </div>

            {/* Right col: reward, links, tags, difficulty, attachments */}
            <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-4">
              <div>
                <label className={labelCls}>Reward *</label>
                <Textarea placeholder="Prize or incentive description" value={rewardText} onChange={(e) => setRewardText(e.target.value)} className={`${inputCls} min-h-[80px]`} />
              </div>
              <div>
                <label className={labelCls}>External link</label>
                <Input placeholder="https://..." value={externalLink} onChange={(e) => setExternalLink(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Tags (comma-separated)</label>
                <Input placeholder="e.g. AI, design, open-source" value={tags} onChange={(e) => setTags(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as "starter" | "builder" | "hardcore" | "")}
                  className="w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm text-white"
                >
                  <option value="">— Not set —</option>
                  <option value="starter">Starter</option>
                  <option value="builder">Builder</option>
                  <option value="hardcore">Hardcore</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Attachments — one per line: <span className="font-mono">Label|https://…</span></label>
                <Textarea placeholder={"Slides|https://...\nDataset|https://..."} value={attachments} onChange={(e) => setAttachments(e.target.value)} className={`${inputCls} min-h-[80px]`} />
              </div>
            </div>
          </div>

          {/* Row 4: Eligibility + Judging rubric — full width */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <label className={labelCls}>Eligibility *</label>
              <Textarea placeholder="Who can participate and any restrictions…" value={eligibility} onChange={(e) => setEligibility(e.target.value)} className={`${inputCls} min-h-[160px] resize-y`} />
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <label className={labelCls}>Judging rubric *</label>
              <Textarea placeholder="How submissions will be evaluated…" value={judgingRubric} onChange={(e) => setJudgingRubric(e.target.value)} className={`${inputCls} min-h-[160px] resize-y`} />
            </div>
          </div>

          {/* Row 5: Hero image upload — file only, no raw URL input */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <label className={labelCls}>Hero image</label>
            <div className="flex items-start gap-4">
              {heroImageUrl ? (
                <div
                  className="h-20 w-32 flex-shrink-0 rounded-lg bg-white/10"
                  style={{ backgroundImage: `url(${heroImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }}
                />
              ) : (
                <div className="flex h-20 w-32 flex-shrink-0 items-center justify-center rounded-lg border border-dashed border-white/20 text-xs text-white/40">
                  No image
                </div>
              )}
              <div className="flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => void handleHeroUpload(e.target.files)}
                  className={inputCls}
                  disabled={uploadingHero}
                />
                {uploadingHero ? (
                  <p className="mt-1 text-xs text-white/60">Uploading…</p>
                ) : heroImageUrl ? (
                  <p className="mt-1 truncate text-xs text-white/40">{heroImageUrl}</p>
                ) : (
                  <p className="mt-1 text-xs text-white/40">Upload a banner image for the challenge card.</p>
                )}
              </div>
            </div>
          </div>

          {/* Winners panel — admin edit only */}
          {mode === "edit" && !isProposal ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="mb-3 text-sm font-medium text-white">Winners</p>
              <div className="space-y-2">
                {winnersRows.map((row, index) => (
                  <div key={`${index}-${row.user_id}`} className="rounded-md border border-white/10 p-3">
                    <Input
                      placeholder="Winner user UUID"
                      value={row.user_id}
                      onChange={(e) => updateWinner(index, { user_id: e.target.value })}
                      className={`mb-2 ${inputCls}`}
                    />
                    <Input
                      placeholder="Placement (e.g. 1st Place)"
                      list={`placement-options-${index}`}
                      value={row.placement}
                      onChange={(e) => updateWinner(index, { placement: e.target.value })}
                      className={`mb-2 ${inputCls}`}
                    />
                    <datalist id={`placement-options-${index}`}>
                      {PLACEMENT_SUGGESTIONS.map((suggestion) => (
                        <option key={suggestion} value={suggestion} />
                      ))}
                    </datalist>
                    <Textarea
                      placeholder="Decision text"
                      value={row.decision_text}
                      onChange={(e) => updateWinner(index, { decision_text: e.target.value })}
                      className={inputCls}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      className="mt-2 rounded-full text-white/70 hover:bg-white/10 hover:text-white"
                      onClick={() => removeWinnerRow(index)}
                      disabled={winnersRows.length <= 1}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <Button type="button" variant="outline" className="rounded-full border-white/20 text-white hover:bg-white/10" onClick={addWinnerRow}>
                  Add row
                </Button>
                <Button type="button" variant="outline" className="rounded-full border-white/20 text-white hover:bg-white/10" disabled={isPending} onClick={() => runAction("winners")}>
                  Save winners
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
