import { Navbar1 } from "@/components/ui/navbar";
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
    <main className="min-h-screen bg-black">
      <Navbar1 />
      <div className="mx-auto max-w-2xl px-4 pt-24 pb-16">
        <h1 className="font-[family-name:var(--font-geist-mono)] text-2xl font-medium text-white">
          Edit your builder profile
        </h1>
        <p className="mt-2 text-white/60">
          @{builder.username}
        </p>
        <EditProfileForm
          builder={{
            ...builder,
            skills: (builder.skills ?? []) as string[],
          }}
          skills={skills ?? []}
        />
      </div>
    </main>
  );
}
