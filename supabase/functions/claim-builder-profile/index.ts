import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { z } from "npm:zod@3.23.8";
import { getUserIdFromRequest, createAdminClient } from "../_shared/auth.ts";
import { getCorsHeaders } from "./_shared/cors.ts";

declare const Deno: {
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
};

const BUILDERS_TABLE = "builders";
const BUILDER_AUTH_TABLE = "builder_auth";

/**
 * Claim an existing builder profile (created via Discord) and link it to the authenticated user.
 * Verification (e.g. one-time code sent to Discord DM) is TBD — see documentation/SCHEMA.md.
 * The endpoint is blocked until the verification flow is implemented (returns 501).
 */
const claimSchema = z.object({
  username: z
    .string()
    .min(1, "username is required")
    .max(50, "username must be 50 characters or fewer"),
  verification_token: z.string().optional(),
});

type ClaimPayload = z.infer<typeof claimSchema>;

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  let userId: string;
  try {
    userId = await getUserIdFromRequest(req);
  } catch (e) {
    console.error("[claim-builder-profile] auth error", {
      message: e instanceof Error ? e.message : String(e),
    });
    return jsonResponse(
      { error: e instanceof Error ? e.message : "Unauthorized" },
      401
    );
  }

  let body: ClaimPayload;
  try {
    const raw = await req.json();
    body = claimSchema.parse(raw);
  } catch (e) {
    const message =
      e instanceof z.ZodError
        ? e.errors.map((err) => `${err.path.join(".")}: ${err.message}`).join("; ")
        : "Invalid JSON body";
    return jsonResponse({ error: message }, 400);
  }

  const { username } = body;

  const slug = username.trim().toLowerCase();

  const admin = createAdminClient();

  // Check user doesn't already have a linked builder
  const { data: existingLink } = await admin
    .from(BUILDER_AUTH_TABLE)
    .select("builder_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (existingLink) {
    return jsonResponse(
      { error: "You already have a builder profile linked" },
      409
    );
  }

  // Find builder by username
  const { data: builder, error: findError } = await admin
    .from(BUILDERS_TABLE)
    .select("id, username")
    .eq("username", slug)
    .maybeSingle();

  if (findError || !builder) {
    return jsonResponse({ error: "Builder profile not found" }, 404);
  }

  // Profile claiming requires a verified token (e.g. Discord DM code) tied to a pending_claims
  // row. This flow is not yet implemented — block all claims unconditionally until it is.
  // Any non-empty verification_token was previously accepted without validation, which is a
  // security hole; this block closes it.
  return jsonResponse(
    {
      error:
        "Profile claiming is not yet available. Contact support on Discord.",
    },
    501
  );

  // eslint-disable-next-line no-unreachable
  const { error: linkError } = await admin.from(BUILDER_AUTH_TABLE).insert({
    user_id: userId,
    builder_id: builder.id,
  });

  if (linkError) {
    if (linkError.code === "23505") {
      return jsonResponse(
        { error: "This profile is already linked to another account" },
        409
      );
    }
    return jsonResponse(
      { error: linkError.message ?? "Failed to claim profile" },
      500
    );
  }

  return jsonResponse({ builder }, 200);
});
