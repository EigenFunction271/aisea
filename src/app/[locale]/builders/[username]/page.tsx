import { createClient } from "@/lib/supabase/server";
import { Navbar1 } from "@/components/ui/navbar";
import { Link } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { ExternalLink } from "lucide-react";

export default async function BuilderProfilePage({
  params,
}: {
  params: Promise<{ locale: string; username: string }>;
}) {
  const { locale, username } = await params;
  const isValidLocale = (loc: string): loc is (typeof routing.locales)[number] =>
    routing.locales.includes(loc as (typeof routing.locales)[number]);
  if (!isValidLocale(locale)) notFound();

  const slug = username.trim().toLowerCase();
  const supabase = await createClient();
  const { data: builder, error } = await supabase
    .from("builders")
    .select("id, username, name, city, bio, skills, github_handle, linkedin_url, instagram_url, twitter_url, personal_url, github_last_active")
    .eq("username", slug)
    .maybeSingle();

  if (error || !builder) notFound();

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, description, stage, github_url, demo_url")
    .eq("builder_id", builder.id)
    .order("created_at", { ascending: false });

  const skills = (builder.skills ?? []) as string[];
  const githubUrl = builder.github_handle
    ? `https://github.com/${builder.github_handle}`
    : null;

  const socials = [
    { label: "GitHub", href: githubUrl },
    { label: "LinkedIn", href: builder.linkedin_url },
    { label: "Instagram", href: builder.instagram_url },
    { label: "X", href: builder.twitter_url },
    { label: "Website", href: builder.personal_url },
  ].filter((s) => s.href);

  return (
    <main className="min-h-screen bg-black">
      <Navbar1 />
      <div className="mx-auto max-w-2xl px-4 pt-24 pb-16">
        <Link
          href="/builders"
          className="text-sm text-white/60 hover:text-white/80"
        >
          ← Directory
        </Link>
        <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-6">
          <h1 className="font-[family-name:var(--font-geist-mono)] text-2xl font-medium text-white">
            {builder.name}
          </h1>
          <p className="text-white/60">
            @{builder.username} · {builder.city}
          </p>
          {builder.bio && (
            <p className="mt-4 text-white/80">{builder.bio}</p>
          )}
          {skills.length > 0 && (
            <p className="mt-3 text-sm text-white/50">
              {skills.join(" · ")}
            </p>
          )}
          {socials.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {socials.map(({ label, href }) => (
                <a
                  key={label}
                  href={href!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-full border border-white/20 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  {label}
                </a>
              ))}
            </div>
          )}
          {builder.github_last_active && (
            <p className="mt-3 text-xs text-white/40">
              Last active: {builder.github_last_active}
            </p>
          )}
        </div>

        {projects && projects.length > 0 && (
          <section className="mt-8">
            <h2 className="font-[family-name:var(--font-geist-mono)] text-lg font-medium text-white">
              Projects
            </h2>
            <ul className="mt-4 space-y-3">
              {projects.map((p) => (
                <li
                  key={p.id}
                  className="rounded-lg border border-white/10 bg-white/5 p-4"
                >
                  <p className="font-medium text-white">{p.name}</p>
                  {p.description && (
                    <p className="mt-1 text-sm text-white/70">
                      {p.description}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-white/50 capitalize">
                    {(p.stage ?? "idea").replace("_", " ")}
                  </p>
                  <div className="mt-2 flex gap-2">
                    {p.demo_url && (
                      <a
                        href={p.demo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-white/60 hover:text-white/80"
                      >
                        Demo
                      </a>
                    )}
                    {p.github_url && (
                      <a
                        href={p.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-white/60 hover:text-white/80"
                      >
                        Repo
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
