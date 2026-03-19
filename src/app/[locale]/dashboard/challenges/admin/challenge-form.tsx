"use client";

import { useMemo, useState, useTransition } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/client";
import { createChallenge, setChallengeWinners, transitionChallenge, updateChallenge } from "@/lib/challenges/edge-functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
  status: "draft" | "published" | "closed" | "archived";
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

function fromLocalDatetimeValue(local: string) {
  if (!local) return "";
  return new Date(local).toISOString();
}

export function ChallengeForm({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial?: ChallengeRecord;
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

  function buildPayload() {
    return {
      title: title.trim(),
      subtitle: subtitle.trim(),
      description: description.trim(),
      hero_image_url: heroImageUrl.trim() || null,
      host_name: hostName.trim(),
      org_name: orgName.trim(),
      start_at: fromLocalDatetimeValue(startAt),
      end_at: fromLocalDatetimeValue(endAt),
      timezone: timezone.trim(),
      reward_text: rewardText.trim(),
      external_link: externalLink.trim() || null,
      tags: tags
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      attachments: attachments
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [label, url] = line.split("|").map((s) => s.trim());
          return { label, url };
        }),
      eligibility: eligibility.trim(),
      judging_rubric: judgingRubric.trim(),
      difficulty: (difficulty || null) as "starter" | "builder" | "hardcore" | null,
    };
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

  function runAction(action: "save" | "publish" | "unpublish" | "close" | "archive" | "winners") {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        const supabase = createClient();
        if (mode === "create") {
          const created = await createChallenge(supabase, {
            ...buildPayload(),
            status: action === "publish" ? "published" : "draft",
          });
          setSuccess(action === "publish" ? "Challenge created and published." : "Challenge draft created.");
          router.push(`/dashboard/challenges/admin/${created.challenge.id}`);
          return;
        }

        if (!initial) throw new Error("Missing challenge context");

        if (action === "save") {
          await updateChallenge(supabase, initial.id, buildPayload());
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

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
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
        {mode === "edit" ? (
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
          Autosave Local Draft
        </Button>
        <Button type="button" variant="outline" className="rounded-full border-white/20 text-white hover:bg-white/10" onClick={restoreAutosave}>
          Restore Draft
        </Button>
        <Button type="button" variant="outline" className="rounded-full border-white/20 text-white hover:bg-white/10" onClick={() => setPreview((p) => !p)}>
          {preview ? "Edit Mode" : "Preview"}
        </Button>
        <Button asChild type="button" variant="ghost" className="rounded-full text-white/70 hover:bg-white/10 hover:text-white">
          <Link href="/dashboard/challenges/admin">Back</Link>
        </Button>
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-400">{success}</p> : null}

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
          <p className="mt-4 whitespace-pre-wrap text-sm text-white/80">{description || "Description preview"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-4">
            <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="border-white/20 bg-white/5 text-white" />
            <Input placeholder="Subtitle" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="border-white/20 bg-white/5 text-white" />
            <Textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} className="border-white/20 bg-white/5 text-white" />
            <Input placeholder="Hero image URL" value={heroImageUrl} onChange={(e) => setHeroImageUrl(e.target.value)} className="border-white/20 bg-white/5 text-white" />
            <div>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => void handleHeroUpload(e.target.files)}
                className="border-white/20 bg-white/5 text-white"
                disabled={uploadingHero}
              />
              {uploadingHero ? <p className="mt-1 text-xs text-white/60">Uploading hero image...</p> : null}
            </div>
            <Input placeholder="Host name" value={hostName} onChange={(e) => setHostName(e.target.value)} className="border-white/20 bg-white/5 text-white" />
            <Input placeholder="Organization name" value={orgName} onChange={(e) => setOrgName(e.target.value)} className="border-white/20 bg-white/5 text-white" />
            <Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} className="border-white/20 bg-white/5 text-white" />
            <Input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} className="border-white/20 bg-white/5 text-white" />
            <Input placeholder="Timezone (e.g. Asia/Singapore)" value={timezone} onChange={(e) => setTimezone(e.target.value)} className="border-white/20 bg-white/5 text-white" />
          </div>
          <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-4">
            <Textarea placeholder="Reward text" value={rewardText} onChange={(e) => setRewardText(e.target.value)} className="border-white/20 bg-white/5 text-white" />
            <Input placeholder="External link" value={externalLink} onChange={(e) => setExternalLink(e.target.value)} className="border-white/20 bg-white/5 text-white" />
            <Input placeholder="Tags (comma-separated)" value={tags} onChange={(e) => setTags(e.target.value)} className="border-white/20 bg-white/5 text-white" />
            <div>
              <label className="mb-1 block text-xs text-white/60">Difficulty (optional)</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as "starter" | "builder" | "hardcore" | "")}
                className="w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm text-white"
              >
                <option value="">— No difficulty set —</option>
                <option value="starter">Starter</option>
                <option value="builder">Builder</option>
                <option value="hardcore">Hardcore</option>
              </select>
            </div>
            <Textarea placeholder={"Attachments (one per line):\nLabel|https://..."} value={attachments} onChange={(e) => setAttachments(e.target.value)} className="border-white/20 bg-white/5 text-white" />
            <Textarea placeholder="Eligibility" value={eligibility} onChange={(e) => setEligibility(e.target.value)} className="border-white/20 bg-white/5 text-white" />
            <Textarea placeholder="Judging rubric" value={judgingRubric} onChange={(e) => setJudgingRubric(e.target.value)} className="border-white/20 bg-white/5 text-white" />
            {mode === "edit" ? (
              <div className="rounded-lg border border-white/10 p-3">
                <p className="mb-2 text-sm text-white/80">Winners</p>
                <div className="space-y-2">
                  {winnersRows.map((row, index) => (
                    <div key={`${index}-${row.user_id}`} className="rounded-md border border-white/10 p-2">
                      <Input
                        placeholder="Winner user UUID"
                        value={row.user_id}
                        onChange={(e) => updateWinner(index, { user_id: e.target.value })}
                        className="mb-2 border-white/20 bg-white/5 text-white"
                      />
                      <Input
                        placeholder="Placement (e.g. 1st Place)"
                        list={`placement-options-${index}`}
                        value={row.placement}
                        onChange={(e) => updateWinner(index, { placement: e.target.value })}
                        className="mb-2 border-white/20 bg-white/5 text-white"
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
                        className="border-white/20 bg-white/5 text-white"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        className="mt-2 rounded-full text-white/70 hover:bg-white/10 hover:text-white"
                        onClick={() => removeWinnerRow(index)}
                        disabled={winnersRows.length <= 1}
                      >
                        Remove row
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-2 rounded-full border-white/20 text-white hover:bg-white/10"
                  onClick={addWinnerRow}
                >
                  Add Winner Row
                </Button>
                <Button type="button" variant="outline" className="mt-2 rounded-full border-white/20 text-white hover:bg-white/10" disabled={isPending} onClick={() => runAction("winners")}>
                  Save Winners
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
