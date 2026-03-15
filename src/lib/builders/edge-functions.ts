import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

const optionalUrl = () => z.union([z.string().url(), z.literal("")]).optional();

const createPayloadSchema = z.object({
  username: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  city: z.string().min(1).max(200),
  bio: z.string().max(160).optional(),
  skills: z.array(z.string()).default([]),
  github_handle: z.string().max(100).optional(),
  linkedin_url: optionalUrl(),
  instagram_url: optionalUrl(),
  twitter_url: optionalUrl(),
  personal_url: optionalUrl(),
});

export type CreateBuilderProfilePayload = z.infer<typeof createPayloadSchema>;

const claimPayloadSchema = z.object({
  username: z.string().min(1).max(100),
});

export type ClaimBuilderProfilePayload = z.infer<typeof claimPayloadSchema>;

const builderResponseSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
});

function cleanUrl(value: string | undefined): string | undefined {
  const v = value?.trim();
  return v && v.length > 0 ? v : undefined;
}

export async function createBuilderProfile(
  supabase: SupabaseClient,
  payload: unknown
): Promise<{ builder: { id: string; username: string } }> {
  const body = createPayloadSchema.parse(payload);
  const clean = {
    ...body,
    linkedin_url: cleanUrl(body.linkedin_url),
    instagram_url: cleanUrl(body.instagram_url),
    twitter_url: cleanUrl(body.twitter_url),
    personal_url: cleanUrl(body.personal_url),
  };

  const { data, error } = await supabase.functions.invoke("create-builder-profile", {
    body: clean,
  });

  if (error) {
    if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
      console.error("[create-builder-profile] error", { request: clean, error });
    }
    throw new Error(error.message ?? "Failed to create profile");
  }

  const parsed = z.object({ builder: builderResponseSchema }).safeParse(data);
  if (!parsed.success) {
    if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
      console.error("[create-builder-profile] unexpected response", { data });
    }
    throw new Error("Invalid response from profile creation");
  }
  return parsed.data;
}

export async function claimBuilderProfile(
  supabase: SupabaseClient,
  payload: unknown
): Promise<{ builder: { id: string; username: string } }> {
  const body = claimPayloadSchema.parse(payload);
  const { data, error } = await supabase.functions.invoke("claim-builder-profile", {
    body: { username: body.username.trim().toLowerCase() },
  });

  if (error) {
    if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
      console.error("[claim-builder-profile] error", { request: body, error });
    }
    throw new Error(error.message ?? "Failed to claim profile");
  }

  const parsed = z.object({ builder: builderResponseSchema }).safeParse(data);
  if (!parsed.success) {
    if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
      console.error("[claim-builder-profile] unexpected response", { data });
    }
    throw new Error("Invalid response from claim");
  }
  return parsed.data;
}
