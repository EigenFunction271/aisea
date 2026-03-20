import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  proposal_id: z.string().uuid(),
  action: z.enum(["apply", "reject"]),
  rejection_note: z.string().max(1000).optional(),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { data: role } = await admin.rpc("get_profile_role", { target_user_id: user.id });
  if (role !== "admin" && role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join("; ") },
      { status: 422 }
    );
  }

  const { proposal_id, action, rejection_note } = parsed.data;

  // Fetch the proposal
  const { data: proposal, error: fetchErr } = await admin
    .from("wiki_pages")
    .select("id, suggested_update_of, title, body, description")
    .eq("id", proposal_id)
    .maybeSingle();

  if (fetchErr || !proposal) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  if (!proposal.suggested_update_of) {
    return NextResponse.json({ error: "Not a proposal" }, { status: 400 });
  }

  if (action === "apply") {
    // Copy proposal body/title onto the original page
    const { error: updateErr } = await admin
      .from("wiki_pages")
      .update({
        title: proposal.title,
        description: proposal.description,
        body: proposal.body,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", proposal.suggested_update_of);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // Mark proposal as live (applied)
    await admin
      .from("wiki_pages")
      .update({ status: "live", reviewed_by: user.id, reviewed_at: new Date().toISOString() })
      .eq("id", proposal_id);
  } else {
    // Reject the proposal
    await admin
      .from("wiki_pages")
      .update({
        status: "rejected",
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        rejection_note: rejection_note ?? null,
      })
      .eq("id", proposal_id);
  }

  return NextResponse.json({ ok: true });
}
