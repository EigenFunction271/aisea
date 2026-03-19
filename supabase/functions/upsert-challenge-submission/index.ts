import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { z } from "npm:zod@3.23.8";
import { getUserIdFromRequest, createAdminClient } from "../_shared/auth.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { getChallengeById, isProfileComplete, jsonResponse } from "../_shared/challenges.ts";

declare const Deno: {
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
};

const COOLDOWN_SECONDS = 30;
const MAX_EVENTS_PER_HOUR = 20;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "text/plain",
  "application/zip",
]);

const submissionFileSchema = z.object({
  path: z.string().min(1),
  mime_type: z.string().min(1),
  size_bytes: z.number().int().positive().max(MAX_FILE_SIZE_BYTES),
});

const payloadSchema = z.object({
  challenge_id: z.string().uuid(),
  status: z.enum(["draft", "submitted", "withdrawn"]),
  submission_url: z.string().url().optional().nullable(),
  submission_text: z.string().max(20000).optional().nullable(),
  submission_files: z.array(submissionFileSchema).max(5).default([]),
});

function isStoragePathOwnedByUser(path: string, userId: string): boolean {
  return path.startsWith(`${userId}/`);
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, corsHeaders);
  }

  let userId: string;
  try {
    userId = await getUserIdFromRequest(req);
  } catch (e) {
    return jsonResponse(
      { error: e instanceof Error ? e.message : "Unauthorized" },
      401,
      corsHeaders
    );
  }

  const isComplete = await isProfileComplete(userId);
  if (!isComplete) {
    return jsonResponse(
      { error: "Complete your dashboard profile before submitting to challenges" },
      403,
      corsHeaders
    );
  }

  let payload: z.infer<typeof payloadSchema>;
  try {
    payload = payloadSchema.parse(await req.json());
  } catch (e) {
    return jsonResponse(
      { error: e instanceof Error ? e.message : "Invalid request payload" },
      400,
      corsHeaders
    );
  }

  if (!payload.submission_url && !payload.submission_text && payload.submission_files.length === 0) {
    return jsonResponse(
      { error: "Provide at least one of submission URL, text, or file upload" },
      400,
      corsHeaders
    );
  }

  const challenge = await getChallengeById(payload.challenge_id);
  if (!challenge) return jsonResponse({ error: "Challenge not found" }, 404, corsHeaders);
  if (challenge.status !== "published") {
    return jsonResponse({ error: "Challenge is not open for submissions" }, 409, corsHeaders);
  }
  if (new Date(challenge.end_at).getTime() <= Date.now()) {
    return jsonResponse({ error: "Challenge deadline has passed" }, 409, corsHeaders);
  }

  const admin = createAdminClient();

  const { data: enrollment } = await admin
    .from("challenge_enrollments")
    .select("id, state")
    .eq("challenge_id", payload.challenge_id)
    .eq("user_id", userId)
    .maybeSingle();

  if (!enrollment) {
    return jsonResponse({ error: "Enroll in challenge before submitting" }, 409, corsHeaders);
  }

  for (const file of payload.submission_files) {
    if (!ALLOWED_MIME_TYPES.has(file.mime_type)) {
      return jsonResponse(
        { error: `Unsupported file type: ${file.mime_type}` },
        400,
        corsHeaders
      );
    }
    if (!isStoragePathOwnedByUser(file.path, userId)) {
      return jsonResponse(
        { error: "Submission files must be uploaded in your own storage path" },
        403,
        corsHeaders
      );
    }
  }

  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count: eventCount } = await admin
    .from("challenge_submission_events")
    .select("id", { count: "exact", head: true })
    .eq("challenge_id", payload.challenge_id)
    .eq("user_id", userId)
    .gte("created_at", hourAgo);

  if ((eventCount ?? 0) >= MAX_EVENTS_PER_HOUR) {
    return jsonResponse(
      { error: "Rate limit exceeded for this challenge. Please try again later." },
      429,
      corsHeaders
    );
  }

  const { data: existing, error: existingError } = await admin
    .from("challenge_submissions")
    .select("*")
    .eq("challenge_id", payload.challenge_id)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingError) return jsonResponse({ error: existingError.message }, 500, corsHeaders);

  const nowIso = new Date().toISOString();
  let nextStatus: "draft" | "submitted" | "withdrawn" = payload.status;

  if (existing?.status === "submitted" && payload.status === "draft") {
    nextStatus = "submitted";
  }

  if (existing) {
    const updatedAt = new Date(existing.updated_at).getTime();
    if (Number.isFinite(updatedAt) && Date.now() - updatedAt < COOLDOWN_SECONDS * 1000) {
      return jsonResponse(
        { error: `Please wait ${COOLDOWN_SECONDS} seconds before updating again` },
        429,
        corsHeaders
      );
    }

    const { data, error } = await admin
      .from("challenge_submissions")
      .update({
        status: nextStatus,
        submission_url: payload.submission_url ?? null,
        submission_text: payload.submission_text ?? null,
        submission_files: payload.submission_files,
        submitted_at: nextStatus === "submitted" ? existing.submitted_at ?? nowIso : existing.submitted_at,
      })
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error) return jsonResponse({ error: error.message }, 500, corsHeaders);

    await admin.from("challenge_submission_events").insert({
      challenge_id: payload.challenge_id,
      user_id: userId,
      event_type:
        nextStatus === "submitted"
          ? "submit"
          : nextStatus === "withdrawn"
            ? "withdraw"
            : "update",
    });

    await admin
      .from("challenge_enrollments")
      .update({ state: nextStatus === "submitted" ? "submitted" : "enrolled" })
      .eq("id", enrollment.id);

    return jsonResponse({ submission: data }, 200, corsHeaders);
  }

  const { data, error } = await admin
    .from("challenge_submissions")
    .insert({
      challenge_id: payload.challenge_id,
      user_id: userId,
      status: nextStatus,
      submission_url: payload.submission_url ?? null,
      submission_text: payload.submission_text ?? null,
      submission_files: payload.submission_files,
      submitted_at: nextStatus === "submitted" ? nowIso : null,
    })
    .select("*")
    .single();

  if (error) return jsonResponse({ error: error.message }, 500, corsHeaders);

  await admin.from("challenge_submission_events").insert({
    challenge_id: payload.challenge_id,
    user_id: userId,
    event_type: nextStatus === "submitted" ? "submit" : "create",
  });

  await admin
    .from("challenge_enrollments")
    .update({ state: nextStatus === "submitted" ? "submitted" : "enrolled" })
    .eq("id", enrollment.id);

  return jsonResponse({ submission: data }, 201, corsHeaders);
});
