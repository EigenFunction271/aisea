import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getUserIdFromRequest, createAdminClient } from "../_shared/auth.ts";
import { corsHeaders } from "../_shared/cors.ts";

const BUILDERS_TABLE = "builders";
const BUILDER_AUTH_TABLE = "builder_auth";

/**
 * Claim an existing builder profile (created via Discord) and link it to the authenticated user.
 * Verification (e.g. one-time code sent to Discord DM) is TBD — see documentation/SCHEMA.md.
 * For now we require a verification_token; implement Discord DM verification in a later iteration.
 */
interface ClaimPayload {
  username: string;
  verification_token?: string;
}

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

Deno.serve(async (req) => {
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
    return jsonResponse(
      { error: e instanceof Error ? e.message : "Unauthorized" },
      401
    );
  }

  let body: ClaimPayload;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const { username } = body;
  if (!username?.trim()) {
    return jsonResponse({ error: "username is required" }, 400);
  }

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

  // TODO: Verify verification_token (e.g. against pending_claims table or Discord DM code).
  // For lighter-trust v1 we could skip verification and allow claim by username only (document risk).
  if (!body.verification_token) {
    return jsonResponse(
      {
        error:
          "Verification required. Claim flow (e.g. Discord DM code) not yet implemented — see documentation/SCHEMA.md",
      },
      501
    );
  }

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
