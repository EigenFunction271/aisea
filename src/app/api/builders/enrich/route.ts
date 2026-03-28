import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const bodySchema = z.object({
  builder_id: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  // Validate session
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Validate body
  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Verify ownership — calling user must own the builder_id
  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json(
      { error: "Server misconfiguration — admin client could not be initialised" },
      { status: 500 }
    );
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

  // Fire-and-forget to Edge Function — do not await the response.
  // The Edge Function uses waitUntil internally and completes asynchronously.
  const edgeFnUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/enrich-github`;
  // Accept both names; SUPABASE_SERVICE_ROLE_KEY is canonical, SUPABASE_SECRET_KEY is legacy.
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !serviceKey) {
    return NextResponse.json(
      { error: "Server misconfiguration — enrichment endpoint not configured" },
      { status: 500 }
    );
  }

  // Get the user's JWT to pass to the Edge Function for ownership validation
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return NextResponse.json({ error: "Session expired" }, { status: 401 });
  }

  void fetch(edgeFnUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      apikey: serviceKey,
    },
    body: JSON.stringify({ builder_id: parsed.builder_id }),
  }).catch((err) => {
    console.error("[/api/builders/enrich] fire-and-forget failed:", err);
  });

  return NextResponse.json({ ok: true });
}
