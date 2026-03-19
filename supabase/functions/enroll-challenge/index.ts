import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { z } from "npm:zod@3.23.8";
import { getUserIdFromRequest, createAdminClient } from "../_shared/auth.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getChallengeById, isProfileComplete, jsonResponse } from "../_shared/challenges.ts";

declare const Deno: {
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
};

const payloadSchema = z.object({
  challenge_id: z.string().uuid(),
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

  const isComplete = await isProfileComplete(userId);
  if (!isComplete) {
    return jsonResponse(
      { error: "Complete your dashboard profile before enrolling in challenges" },
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

  const challenge = await getChallengeById(payload.challenge_id);
  if (!challenge) return jsonResponse({ error: "Challenge not found" }, 404, corsHeaders);
  if (challenge.status !== "published") {
    return jsonResponse({ error: "Challenge is not open for enrollment" }, 409, corsHeaders);
  }
  if (new Date(challenge.end_at).getTime() <= Date.now()) {
    return jsonResponse({ error: "Challenge enrollment deadline has passed" }, 409, corsHeaders);
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("challenge_enrollments")
    .select("id, state")
    .eq("challenge_id", payload.challenge_id)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    return jsonResponse({ enrollment: existing }, 200, corsHeaders);
  }

  const { data, error } = await admin
    .from("challenge_enrollments")
    .insert({
      challenge_id: payload.challenge_id,
      user_id: userId,
      state: "enrolled",
      enrolled_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) return jsonResponse({ error: error.message }, 500, corsHeaders);
  return jsonResponse({ enrollment: data }, 201, corsHeaders);
});
