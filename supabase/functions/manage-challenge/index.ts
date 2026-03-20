import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { z } from "npm:zod@3.23.8";
import { getUserIdFromRequest, createAdminClient } from "../_shared/auth.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import {
  canManageChallenge,
  getChallengeById,
  getUserRole,
  jsonResponse,
} from "../_shared/challenges.ts";

declare const Deno: {
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
};

const actionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("create"),
    payload: z
      .object({
        title: z.string().max(200),
        subtitle: z.string().max(240),
        description: z.string().max(20000),
        hero_image_url: z.string().url().optional().nullable(),
        host_name: z.string().max(200),
        org_name: z.string().max(200),
        // Accept string or null for drafts; superRefine enforces valid datetimes for published.
        start_at: z.string().nullable().optional(),
        end_at: z.string().nullable().optional(),
        timezone: z.string().max(80),
        reward_text: z.string().max(3000),
        external_link: z.string().url().optional().nullable(),
        tags: z.array(z.string().min(1).max(60)).default([]),
        attachments: z
          .array(z.object({ label: z.string().min(1).max(120), url: z.string().url() }))
          .default([]),
        eligibility: z.string().max(10000),
        judging_rubric: z.string().max(10000),
        difficulty: z.enum(["starter", "builder", "hardcore"]).nullable().optional(),
        status: z.enum(["draft", "published"]).default("draft"),
      })
      .superRefine((p, ctx) => {
        if (p.status !== "published") return;
        const requiredText = [
          "title", "subtitle", "description", "host_name",
          "org_name", "reward_text", "eligibility", "judging_rubric",
        ] as const;
        for (const field of requiredText) {
          if (!p[field].trim()) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `${field.replace(/_/g, " ")} is required to publish`,
              path: [field],
            });
          }
        }
        const startMs = new Date(p.start_at ?? "").getTime();
        const endMs = new Date(p.end_at ?? "").getTime();
        if (!p.start_at || !Number.isFinite(startMs))
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "start_at must be a valid datetime to publish", path: ["start_at"] });
        if (!p.end_at || !Number.isFinite(endMs))
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "end_at must be a valid datetime to publish", path: ["end_at"] });
        if (Number.isFinite(startMs) && Number.isFinite(endMs) && endMs <= startMs)
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "end_at must be after start_at", path: ["end_at"] });
      }),
  }),
  z.object({
    action: z.literal("update"),
    challenge_id: z.string().uuid(),
    payload: z
      .object({
        title: z.string().max(200).optional(),
        subtitle: z.string().max(240).optional(),
        description: z.string().max(20000).optional(),
        hero_image_url: z.string().url().optional().nullable(),
        host_name: z.string().max(200).optional(),
        org_name: z.string().max(200).optional(),
        start_at: z.string().optional(),
        end_at: z.string().optional(),
        timezone: z.string().max(80).optional(),
        reward_text: z.string().max(3000).optional(),
        external_link: z.string().url().optional().nullable(),
        tags: z.array(z.string().min(1).max(60)).optional(),
        attachments: z
          .array(z.object({ label: z.string().min(1).max(120), url: z.string().url() }))
          .optional(),
        eligibility: z.string().max(10000).optional(),
        judging_rubric: z.string().max(10000).optional(),
        difficulty: z.enum(["starter", "builder", "hardcore"]).nullable().optional(),
      })
      .refine((v) => Object.keys(v).length > 0, "At least one field must be provided"),
  }),
  z.object({
    action: z.literal("publish"),
    challenge_id: z.string().uuid(),
  }),
  z.object({
    action: z.literal("unpublish"),
    challenge_id: z.string().uuid(),
  }),
  z.object({
    action: z.literal("archive"),
    challenge_id: z.string().uuid(),
  }),
  z.object({
    action: z.literal("close"),
    challenge_id: z.string().uuid(),
  }),
  z.object({
    action: z.literal("set_winners"),
    challenge_id: z.string().uuid(),
    payload: z.object({
      winners: z.array(
        z.object({
          user_id: z.string().uuid(),
          placement: z.string().min(1).max(64),
          decision_text: z.string().min(1).max(5000),
        })
      ),
    }),
  }),
  z.object({
    action: z.literal("set_owner"),
    challenge_id: z.string().uuid(),
    payload: z.object({ owner_user_id: z.string().uuid() }),
  }),
]);

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

  const role = await getUserRole(userId);
  if (role !== "admin" && role !== "super_admin") {
    return jsonResponse({ error: "Forbidden" }, 403, corsHeaders);
  }

  let parsed: z.infer<typeof actionSchema>;
  try {
    parsed = actionSchema.parse(await req.json());
  } catch (e) {
    return jsonResponse(
      { error: e instanceof Error ? e.message : "Invalid request payload" },
      400,
      corsHeaders
    );
  }

  const admin = createAdminClient();

  if (parsed.action === "create") {
    const now = new Date().toISOString();

    // Server-side fallback dates for drafts when the client omits them.
    // The DB columns are NOT NULL so we must always supply a value.
    const nowMs = Date.now();
    const fallbackStart = new Date(nowMs + 24 * 60 * 60 * 1000).toISOString();
    const fallbackEnd   = new Date(nowMs + 8 * 24 * 60 * 60 * 1000).toISOString();
    const resolvedStart = parsed.payload.start_at ?? fallbackStart;
    const resolvedEnd   = parsed.payload.end_at   ?? fallbackEnd;

    const startAt = new Date(resolvedStart).getTime();
    const endAt   = new Date(resolvedEnd).getTime();

    // Only enforce ordering when both dates are present and parseable.
    if (
      Number.isFinite(startAt) && Number.isFinite(endAt) &&
      endAt <= startAt
    ) {
      return jsonResponse({ error: "end_at must be after start_at" }, 400, corsHeaders);
    }

    const status = parsed.payload.status;
    const row = {
      ...parsed.payload,
      start_at: resolvedStart,
      end_at: resolvedEnd,
      created_by: userId,
      status,
      published_at: status === "published" ? now : null,
    };

    const { data, error } = await admin.from("challenges").insert(row).select("*").single();
    if (error) return jsonResponse({ error: error.message }, 500, corsHeaders);
    return jsonResponse({ challenge: data }, 201, corsHeaders);
  }

  const challenge = await getChallengeById(parsed.challenge_id);
  if (!challenge) return jsonResponse({ error: "Challenge not found" }, 404, corsHeaders);
  if (!canManageChallenge(userId, role, challenge.created_by)) {
    return jsonResponse({ error: "Forbidden" }, 403, corsHeaders);
  }

  if (parsed.action === "update") {
    if (challenge.status === "archived") {
      return jsonResponse({ error: "Archived challenges are read-only" }, 409, corsHeaders);
    }

    if (parsed.payload.start_at || parsed.payload.end_at) {
      const nextStart = new Date(parsed.payload.start_at ?? challenge.start_at).getTime();
      const nextEnd = new Date(parsed.payload.end_at ?? challenge.end_at).getTime();
      // Only enforce ordering when both sides resolve to a parseable date.
      if (Number.isFinite(nextStart) && Number.isFinite(nextEnd) && nextEnd <= nextStart) {
        return jsonResponse({ error: "end_at must be after start_at" }, 400, corsHeaders);
      }
    }

    const { data, error } = await admin
      .from("challenges")
      .update(parsed.payload)
      .eq("id", parsed.challenge_id)
      .select("*")
      .single();

    if (error) return jsonResponse({ error: error.message }, 500, corsHeaders);
    return jsonResponse({ challenge: data }, 200, corsHeaders);
  }

  if (parsed.action === "publish") {
    const { data, error } = await admin
      .from("challenges")
      .update({ status: "published", published_at: new Date().toISOString() })
      .eq("id", parsed.challenge_id)
      .select("*")
      .single();
    if (error) return jsonResponse({ error: error.message }, 500, corsHeaders);
    return jsonResponse({ challenge: data }, 200, corsHeaders);
  }

  if (parsed.action === "unpublish") {
    const { data, error } = await admin
      .from("challenges")
      .update({ status: "draft" })
      .eq("id", parsed.challenge_id)
      .select("*")
      .single();
    if (error) return jsonResponse({ error: error.message }, 500, corsHeaders);
    return jsonResponse({ challenge: data }, 200, corsHeaders);
  }

  if (parsed.action === "close") {
    const now = new Date().toISOString();
    const { data, error } = await admin
      .from("challenges")
      .update({ status: "closed", closed_at: now })
      .eq("id", parsed.challenge_id)
      .select("*")
      .single();
    if (error) return jsonResponse({ error: error.message }, 500, corsHeaders);
    return jsonResponse({ challenge: data }, 200, corsHeaders);
  }

  if (parsed.action === "archive") {
    const now = new Date().toISOString();
    const { data, error } = await admin
      .from("challenges")
      .update({ status: "archived", archived_at: now })
      .eq("id", parsed.challenge_id)
      .select("*")
      .single();
    if (error) return jsonResponse({ error: error.message }, 500, corsHeaders);
    return jsonResponse({ challenge: data }, 200, corsHeaders);
  }

  if (parsed.action === "set_winners") {
    if (challenge.status !== "closed") {
      return jsonResponse(
        { error: "Winners can only be selected after challenge closes" },
        409,
        corsHeaders
      );
    }

    const { data, error } = await admin
      .from("challenges")
      .update({
        winners: parsed.payload.winners,
        winner_announced_at: new Date().toISOString(),
      })
      .eq("id", parsed.challenge_id)
      .select("*")
      .single();

    if (error) return jsonResponse({ error: error.message }, 500, corsHeaders);
    return jsonResponse({ challenge: data }, 200, corsHeaders);
  }

  // parsed.action === "set_owner"
  if (role !== "super_admin") {
    return jsonResponse({ error: "Only super_admin can reassign challenge owner" }, 403, corsHeaders);
  }

  const { data, error } = await admin
    .from("challenges")
    .update({ created_by: parsed.payload.owner_user_id })
    .eq("id", parsed.challenge_id)
    .select("*")
    .single();

  if (error) return jsonResponse({ error: error.message }, 500, corsHeaders);
  return jsonResponse({ challenge: data }, 200, corsHeaders);
});
