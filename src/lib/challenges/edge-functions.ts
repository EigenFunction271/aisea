import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { challengeSchema, challengeSubmissionSchema } from "./schemas";

const challengeAttachmentSchema = z.object({
  label: z.string().min(1).max(120),
  url: z.string().url(),
});

const challengeWinnerSchema = z.object({
  user_id: z.string().uuid(),
  placement: z.string().min(1).max(64),
  decision_text: z.string().min(1).max(5000),
});

const createChallengePayloadSchema = z.object({
  title: z.string().min(1).max(200),
  subtitle: z.string().min(1).max(240),
  description: z.string().min(1).max(20000),
  hero_image_url: z.string().url().optional().nullable(),
  host_name: z.string().min(1).max(200),
  org_name: z.string().min(1).max(200),
  start_at: z.string(),
  end_at: z.string(),
  timezone: z.string().min(1).max(80),
  reward_text: z.string().min(1).max(3000),
  external_link: z.string().url().optional().nullable(),
  tags: z.array(z.string().min(1).max(60)).default([]),
  attachments: z.array(challengeAttachmentSchema).default([]),
  eligibility: z.string().min(1).max(10000),
  judging_rubric: z.string().min(1).max(10000),
  status: z.enum(["draft", "published"]).default("draft"),
});

const updateChallengePayloadSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    subtitle: z.string().min(1).max(240).optional(),
    description: z.string().min(1).max(20000).optional(),
    hero_image_url: z.string().url().optional().nullable(),
    host_name: z.string().min(1).max(200).optional(),
    org_name: z.string().min(1).max(200).optional(),
    start_at: z.string().optional(),
    end_at: z.string().optional(),
    timezone: z.string().min(1).max(80).optional(),
    reward_text: z.string().min(1).max(3000).optional(),
    external_link: z.string().url().optional().nullable(),
    tags: z.array(z.string().min(1).max(60)).optional(),
    attachments: z.array(challengeAttachmentSchema).optional(),
    eligibility: z.string().min(1).max(10000).optional(),
    judging_rubric: z.string().min(1).max(10000).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, "At least one field must be provided");

const manageChallengeResponseSchema = z.object({ challenge: challengeSchema });
const enrollChallengeResponseSchema = z.object({
  enrollment: z.object({
    id: z.string().uuid(),
    challenge_id: z.string().uuid().optional(),
    user_id: z.string().uuid().optional(),
    state: z.string(),
  }),
});
const upsertSubmissionResponseSchema = z.object({ submission: challengeSubmissionSchema });
const reviewSubmissionResponseSchema = z.object({ submission: challengeSubmissionSchema });

const upsertSubmissionPayloadSchema = z.object({
  challenge_id: z.string().uuid(),
  status: z.enum(["draft", "submitted", "withdrawn"]),
  submission_url: z.string().url().optional().nullable(),
  submission_text: z.string().max(20000).optional().nullable(),
  submission_files: z
    .array(
      z.object({
        path: z.string().min(1),
        mime_type: z.string().min(1),
        size_bytes: z.number().int().positive().max(5 * 1024 * 1024),
      })
    )
    .max(5)
    .default([]),
});

const reviewSubmissionPayloadSchema = z.object({
  submission_id: z.string().uuid(),
  status: z.enum(["under_review", "accepted", "rejected"]),
  review_decision_text: z.string().min(1).max(5000),
});

async function getSessionToken(supabase: SupabaseClient): Promise<string> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error) throw new Error(error.message ?? "Failed to read auth session");
  if (!session?.access_token) throw new Error("You are not signed in. Please log in and try again.");
  return session.access_token;
}

async function invokeWithAuth<T>(
  supabase: SupabaseClient,
  functionName: string,
  body: unknown,
  responseSchema: z.ZodType<T>
): Promise<T> {
  const token = await getSessionToken(supabase);
  const { data, error } = await supabase.functions.invoke(functionName, {
    body,
    headers: { Authorization: `Bearer ${token}` },
  });

  if (error) {
    if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
      console.debug(`[${functionName}] request failed`, { body, error });
    }
    throw new Error(error.message ?? `Failed to invoke ${functionName}`);
  }

  const parsed = responseSchema.safeParse(data);
  if (!parsed.success) {
    if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
      console.debug(`[${functionName}] invalid response`, { data });
    }
    throw new Error(`Invalid response from ${functionName}`);
  }

  return parsed.data;
}

export async function createChallenge(supabase: SupabaseClient, payload: unknown) {
  const body = createChallengePayloadSchema.parse(payload);
  return invokeWithAuth(
    supabase,
    "manage-challenge",
    { action: "create", payload: body },
    manageChallengeResponseSchema
  );
}

export async function updateChallenge(
  supabase: SupabaseClient,
  challengeId: string,
  payload: unknown
) {
  const body = updateChallengePayloadSchema.parse(payload);
  return invokeWithAuth(
    supabase,
    "manage-challenge",
    { action: "update", challenge_id: challengeId, payload: body },
    manageChallengeResponseSchema
  );
}

export async function transitionChallenge(
  supabase: SupabaseClient,
  challengeId: string,
  action: "publish" | "unpublish" | "close" | "archive"
) {
  return invokeWithAuth(
    supabase,
    "manage-challenge",
    { action, challenge_id: challengeId },
    manageChallengeResponseSchema
  );
}

export async function setChallengeWinners(
  supabase: SupabaseClient,
  challengeId: string,
  winners: unknown
) {
  const parsedWinners = z.array(challengeWinnerSchema).parse(winners);
  return invokeWithAuth(
    supabase,
    "manage-challenge",
    { action: "set_winners", challenge_id: challengeId, payload: { winners: parsedWinners } },
    manageChallengeResponseSchema
  );
}

export async function reassignChallengeOwner(
  supabase: SupabaseClient,
  challengeId: string,
  ownerUserId: string
) {
  return invokeWithAuth(
    supabase,
    "manage-challenge",
    { action: "set_owner", challenge_id: challengeId, payload: { owner_user_id: ownerUserId } },
    manageChallengeResponseSchema
  );
}

export async function enrollInChallenge(supabase: SupabaseClient, challengeId: string) {
  return invokeWithAuth(
    supabase,
    "enroll-challenge",
    { challenge_id: challengeId },
    enrollChallengeResponseSchema
  );
}

export async function upsertChallengeSubmission(supabase: SupabaseClient, payload: unknown) {
  const body = upsertSubmissionPayloadSchema.parse(payload);
  return invokeWithAuth(
    supabase,
    "upsert-challenge-submission",
    body,
    upsertSubmissionResponseSchema
  );
}

export async function reviewChallengeSubmission(supabase: SupabaseClient, payload: unknown) {
  const body = reviewSubmissionPayloadSchema.parse(payload);
  return invokeWithAuth(
    supabase,
    "review-challenge-submission",
    body,
    reviewSubmissionResponseSchema
  );
}
