import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const itemSchema = z.object({
  id: z.string().uuid(),
  parent_id: z.string().uuid().nullable(),
  sort_order: z.number().int().min(0),
});

const schema = z.object({
  updates: z.array(itemSchema).min(1).max(500),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { data: role } = await admin.rpc("get_profile_role", {
    target_user_id: user.id,
  });
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

  // Run all updates. Use admin client to bypass RLS.
  const errors: string[] = [];
  for (const item of parsed.data.updates) {
    const { error } = await admin
      .from("wiki_pages")
      .update({ parent_id: item.parent_id, sort_order: item.sort_order })
      .eq("id", item.id);
    if (error) errors.push(`${item.id}: ${error.message}`);
  }

  if (errors.length) {
    return NextResponse.json({ error: errors.join("; ") }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
