import { createAdminClient } from "./auth.ts";

export type AppRole = "member" | "admin" | "super_admin";

export interface ChallengeRecord {
  id: string;
  created_by: string;
  status: "draft" | "published" | "closed" | "archived" | "pending_review";
  start_at: string;
  end_at: string;
}

export function jsonResponse(body: unknown, status: number, corsHeaders: HeadersInit) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

export async function getUserRole(userId: string): Promise<AppRole> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("get_profile_role", {
    target_user_id: userId,
  });
  if (error) {
    throw new Error(error.message ?? "Failed to resolve profile role");
  }
  const role = (data ?? "member") as AppRole;
  if (role === "admin" || role === "super_admin") return role;
  return "member";
}

export async function isProfileComplete(userId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("is_profile_complete_for_challenges", {
    target_user_id: userId,
  });
  if (error) {
    throw new Error(error.message ?? "Failed to verify profile completeness");
  }
  return data === true;
}

export async function getChallengeById(challengeId: string): Promise<ChallengeRecord | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("challenges")
    .select("id, created_by, status, start_at, end_at")
    .eq("id", challengeId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message ?? "Failed to load challenge");
  }
  return (data as ChallengeRecord | null) ?? null;
}

export function canManageChallenge(userId: string, role: AppRole, challengeOwnerId: string): boolean {
  if (role === "super_admin") return true;
  return role === "admin" && userId === challengeOwnerId;
}
