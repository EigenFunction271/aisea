"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { ExternalLink, Trophy, UserPlus, Users } from "lucide-react";

type BuilderProfile = {
  id: string;
  username: string;
  name: string;
  city: string;
  bio: string | null;
  skills: string[];
  github_handle: string | null;
  project_count: number;
};

export function DashboardContent({
  builder,
  userEmail,
}: {
  builder: BuilderProfile | null;
  userEmail?: string;
}) {
  const t = useTranslations("dashboard");

  return (
    <div className="mx-auto max-w-2xl px-4 pt-24 pb-16">
      <h1 className="font-[family-name:var(--font-geist-mono)] text-2xl font-medium text-white">
        {t("title")}
      </h1>
      {userEmail && (
        <p className="mt-1 text-sm text-white/60">{userEmail}</p>
      )}

      {builder ? (
        <div className="mt-8 space-y-6">
          <section className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h2 className="font-[family-name:var(--font-geist-mono)] text-lg font-medium text-white">
              {t("yourProfile")}
            </h2>
            <p className="mt-2 text-white/80">
              {builder.name} · {builder.city}
            </p>
            {builder.bio && (
              <p className="mt-1 text-sm text-white/60">{builder.bio}</p>
            )}
            <p className="mt-2 text-sm text-white/50">
              @{builder.username}
              {builder.project_count > 0 && (
                <> · {t("projectCount", { count: builder.project_count })}</>
              )}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild variant="secondary" size="sm" className="rounded-full">
                <Link href={`/builders/${builder.username}`}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  {t("viewPublicProfile")}
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="rounded-full border-white/20 text-white/90 hover:bg-white/10">
                <Link href="/dashboard/edit-profile">
                  {t("editProfile")}
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="rounded-full border-white/20 text-white/90 hover:bg-white/10">
                <Link href="/builders">
                  <Users className="mr-2 h-4 w-4" />
                  {t("browseDirectory")}
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="rounded-full border-white/20 text-white/90 hover:bg-white/10">
                <Link href="/dashboard/challenges">
                  <Trophy className="mr-2 h-4 w-4" />
                  Challenges
                </Link>
              </Button>
            </div>
          </section>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          <section className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h2 className="font-[family-name:var(--font-geist-mono)] text-lg font-medium text-white">
              {t("noProfileTitle")}
            </h2>
            <p className="mt-2 text-sm text-white/70">
              {t("noProfileDescription")}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button asChild className="rounded-full font-[family-name:var(--font-geist-mono)] bg-white text-black hover:bg-white/90">
                <Link href="/dashboard/create-profile">
                  <UserPlus className="mr-2 h-4 w-4" />
                  {t("createProfile")}
                </Link>
              </Button>
              <Button asChild variant="outline" size="default" className="rounded-full border-white/20 text-white/90 hover:bg-white/10">
                <Link href="/dashboard/claim-profile">
                  {t("claimExistingProfile")}
                </Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-white/50">
              {t("orUseDiscord")}
            </p>
          </section>
          <p className="text-center">
            <Link href="/builders" className="text-sm text-white/60 hover:text-white/80">
              {t("browseDirectory")} →
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
