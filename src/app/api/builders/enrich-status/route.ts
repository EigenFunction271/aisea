import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const querySchema = z.object({
  builder_id: z.string().uuid(),
});

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  let parsed: z.infer<typeof querySchema>;
  try {
    parsed = querySchema.parse({ builder_id: searchParams.get("builder_id") });
  } catch {
    return NextResponse.json(
      { error: "Missing or invalid builder_id" },
      { status: 400 }
    );
  }

  // Verify ownership
  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }
  const { data: link } = await admin
    .from("builder_auth")
    .select("builder_id")
    .eq("user_id", user.id)
    .eq("builder_id", parsed.builder_id)
    .maybeSingle();

  if (!link) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: builder } = await admin
    .from("builders")
    .select("github_enriched_at, github_handle")
    .eq("id", parsed.builder_id)
    .maybeSingle();

  return NextResponse.json({
    github_enriched_at: builder?.github_enriched_at ?? null,
    has_github_handle: Boolean(builder?.github_handle),
  });
}
