import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CreateProfileForm } from "./create-profile-form";

export default async function CreateProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/${locale}/login?next=/${locale}/dashboard/create-profile`);
  }

  const { data: link } = await supabase
    .from("builder_auth")
    .select("builder_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (link) {
    redirect(`/${locale}/dashboard`);
  }

  const { data: skills } = await supabase
    .from("skills")
    .select("slug, label, sort_order")
    .order("sort_order", { ascending: true, nullsFirst: false });

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <h1
        className="text-2xl font-bold"
        style={{ fontFamily: "var(--font-syne), sans-serif", color: "var(--ds-text-primary)" }}
      >
        Create your builder profile
      </h1>
      <p className="mt-2 text-sm" style={{ color: "var(--ds-text-secondary)" }}>
        This will create your profile in the AI.SEA builder directory. Add your socials so others can find you.
      </p>
      <CreateProfileForm skills={skills ?? []} />
    </div>
  );
}
