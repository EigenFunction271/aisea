import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EditProfileForm } from "./edit-profile-form";

export default async function EditProfilePage({
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
    redirect(`/${locale}/login?next=/${locale}/dashboard/edit-profile`);
  }

  const { data: link } = await supabase
    .from("builder_auth")
    .select("builder_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!link) {
    redirect(`/${locale}/dashboard`);
  }

  const { data: builder, error } = await supabase
    .from("builders")
    .select("id, username, name, city, bio, skills, github_handle, linkedin_url, instagram_url, twitter_url, personal_url")
    .eq("id", link.builder_id)
    .single();

  if (error || !builder) {
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
        Edit profile
      </h1>
      <p className="mt-1 text-sm" style={{ fontFamily: "var(--font-dm-mono), monospace", color: "var(--ds-text-muted)" }}>
        @{builder.username}
      </p>
      <EditProfileForm
        builder={{
          ...builder,
          skills: (builder.skills ?? []) as string[],
        }}
        skills={skills ?? []}
        locale={locale}
        hasGithubLinked={
          user.identities?.some((i) => i.provider === "github") ?? false
        }
      />
    </div>
  );
}
