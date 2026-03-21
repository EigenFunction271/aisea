import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { z } from "npm:zod@3.23.8";
import { getUserIdFromRequest, createAdminClient } from "../_shared/auth.ts";
import { getCorsHeaders } from "./_shared/cors.ts";

declare const Deno: {
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
};

const BUILDERS_TABLE = "builders";
const BUILDER_AUTH_TABLE = "builder_auth";
const SKILLS_TABLE = "skills";

const URL_MAX = 500;

const createProfileSchema = z.object({
  username: z
    .string()
    .min(1, "username is required")
    .max(50, "username must be 50 characters or fewer")
    .regex(/^[a-zA-Z0-9_-]+$/, "username may only contain letters, numbers, hyphens, and underscores"),
  name: z.string().min(1, "name is required").max(100, "name must be 100 characters or fewer"),
  city: z.string().min(1, "city is required").max(100, "city must be 100 characters or fewer"),
  bio: z.string().max(160, "bio must be 160 characters or fewer").optional(),
  skills: z.array(z.string().max(100)).max(20, "maximum 20 skills").default([]),
  github_handle: z.string().max(100).optional().nullable(),
  linkedin_url: z.string().url("invalid LinkedIn URL").max(URL_MAX).optional().nullable(),
  instagram_url: z.string().url("invalid Instagram URL").max(URL_MAX).optional().nullable(),
  twitter_url: z.string().url("invalid Twitter URL").max(URL_MAX).optional().nullable(),
  personal_url: z.string().url("invalid personal URL").max(URL_MAX).optional().nullable(),
});

type CreateBuilderProfilePayload = z.infer<typeof createProfileSchema>;

function jsonResponse(
  body: unknown,
  status: number,
  corsHeaders: Record<string, string>
) {
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
    return jsonResponse({ error: "Method not allowed" }, 405, corsHeaders);
  }

  let userId: string;
  try {
    userId = await getUserIdFromRequest(req);
  } catch (e) {
    console.error("[create-builder-profile] auth error", {
      message: e instanceof Error ? e.message : String(e),
    });
    return jsonResponse(
      { error: e instanceof Error ? e.message : "Unauthorized" },
      401,
      corsHeaders
    );
  }

  let body: CreateBuilderProfilePayload;
  try {
    const raw = await req.json();
    body = createProfileSchema.parse(raw);
  } catch (e) {
    const message =
      e instanceof z.ZodError
        ? e.errors.map((err) => `${err.path.join(".")}: ${err.message}`).join("; ")
        : "Invalid JSON body";
    return jsonResponse({ error: message }, 400, corsHeaders);
  }

  const { username, name, city, bio, skills, github_handle, linkedin_url, instagram_url, twitter_url, personal_url } = body;

  const slug = username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-");
  if (!slug) {
    return jsonResponse({ error: "Invalid username" }, 400, corsHeaders);
  }

  const admin = createAdminClient();

  // Check username unique
  const { data: existing } = await admin
    .from(BUILDERS_TABLE)
    .select("id")
    .eq("username", slug)
    .maybeSingle();
  if (existing) {
    return jsonResponse({ error: "Username already taken" }, 409, corsHeaders);
  }

  // Validate skills slugs exist
  if (skills.length > 0) {
    const { data: validSkills } = await admin
      .from(SKILLS_TABLE)
      .select("slug")
      .in("slug", skills);
    const validSet = new Set((validSkills ?? []).map((r) => r.slug));
    const invalid = skills.filter((s) => !validSet.has(s));
    if (invalid.length > 0) {
      return jsonResponse(
        { error: `Invalid skills: ${invalid.join(", ")}` },
        400,
        corsHeaders
      );
    }
  }

  const builderRow = {
    username: slug,
    discord_id: null,
    name: name.trim(),
    city: city.trim(),
    bio: bio?.trim()?.slice(0, 160) ?? null,
    skills: skills,
    github_handle: github_handle?.trim() || null,
    linkedin_url: linkedin_url?.trim() || null,
    instagram_url: instagram_url?.trim() || null,
    twitter_url: twitter_url?.trim() || null,
    personal_url: personal_url?.trim() || null,
  };

  const { data: builder, error: insertError } = await admin
    .from(BUILDERS_TABLE)
    .insert(builderRow)
    .select()
    .single();

  if (insertError) {
    return jsonResponse(
      { error: insertError.message ?? "Failed to create profile" },
      500,
      corsHeaders
    );
  }

  const { error: linkError } = await admin.from(BUILDER_AUTH_TABLE).insert({
    user_id: userId,
    builder_id: builder.id,
  });

  if (linkError) {
    if (linkError.code === "23505") {
      return jsonResponse(
        { error: "You already have a builder profile linked" },
        409,
        corsHeaders
      );
    }
    return jsonResponse(
      { error: linkError.message ?? "Failed to link profile" },
      500,
      corsHeaders
    );
  }

  return jsonResponse({ builder }, 201, corsHeaders);
});
