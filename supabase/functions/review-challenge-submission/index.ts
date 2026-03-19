import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { z } from "npm:zod@3.23.8";
import { getUserIdFromRequest, createAdminClient } from "../_shared/auth.ts";
import { corsHeaders } from "../_shared/cors.ts";
import {
  canManageChallenge,
  getChallengeById,
  getUserRole,
  jsonResponse,
} from "../_shared/challenges.ts";

declare const Deno: {
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
};

const payloadSchema = z.object({
  submission_id: z.string().uuid(),
  status: z.enum(["under_review", "accepted", "rejected"]),
  review_decision_text: z.string().min(1).max(5000),
});

Deno.serve(async (req) => {
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

  const role = await getUserRole(userId);
  if (role !== "admin" && role !== "super_admin") {
    return jsonResponse({ error: "Forbidden" }, 403, corsHeaders);
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

  const admin = createAdminClient();
  const { data: submission, error: subError } = await admin
    .from("challenge_submissions")
    .select("id, challenge_id, user_id")
    .eq("id", payload.submission_id)
    .maybeSingle();

  if (subError) return jsonResponse({ error: subError.message }, 500, corsHeaders);
  if (!submission) return jsonResponse({ error: "Submission not found" }, 404, corsHeaders);

  const challenge = await getChallengeById(submission.challenge_id);
  if (!challenge) return jsonResponse({ error: "Challenge not found" }, 404, corsHeaders);
  if (!canManageChallenge(userId, role, challenge.created_by)) {
    return jsonResponse({ error: "Forbidden" }, 403, corsHeaders);
  }

  const { data, error } = await admin
    .from("challenge_submissions")
    .update({
      status: payload.status,
      review_decision_text: payload.review_decision_text,
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", payload.submission_id)
    .select("*")
    .single();

  if (error) return jsonResponse({ error: error.message }, 500, corsHeaders);
  return jsonResponse({ submission: data }, 200, corsHeaders);
});
