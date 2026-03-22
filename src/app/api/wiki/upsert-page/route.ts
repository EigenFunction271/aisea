import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  title: z.string().min(1).max(200),
  description: z.string().max(500).default(""),
  body: z.string().nullable().default(null),
  type: z.enum(["guide", "reference", "resource", "section"]),
  parent_id: z.string().uuid().nullable().default(null),
  status: z.enum(["draft", "pending_review"]),
  suggested_update_of: z.string().uuid().optional(),
});

export async function POST(req: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
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

  const data = parsed.data;
  const isNew = !data.id;

  if (isNew) {
    // Insert — RLS enforces author_id = auth.uid() and status draft or pending_review
    const { data: inserted, error } = await supabase
      .from("wiki_pages")
      .insert({
        slug: data.slug,
        title: data.title,
        description: data.description,
        body: data.body,
        type: data.type,
        parent_id: data.parent_id,
        status: data.status,
        author_id: user.id,
        ...(data.suggested_update_of
          ? { suggested_update_of: data.suggested_update_of }
          : {}),
      })
      .select("id, slug")
      .single();

    if (error) {
      // Slug conflict
      if (error.code === "23505") {
        return NextResponse.json({ error: `Slug "${data.slug}" is already taken.` }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ id: inserted.id, slug: inserted.slug });
  } else {
    // Update — RLS allows author (draft / needs_update / pending_review) or admin (any status)
    const { data: updated, error } = await supabase
      .from("wiki_pages")
      .update({
        slug: data.slug,
        title: data.title,
        description: data.description,
        body: data.body,
        type: data.type,
        parent_id: data.parent_id,
        status: data.status,
      })
      .eq("id", data.id!)
      .select("id, slug")
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: `Slug "${data.slug}" is already taken.` }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ id: updated.id, slug: updated.slug });
  }
}
