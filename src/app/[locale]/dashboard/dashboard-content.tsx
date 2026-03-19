"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ExternalLink, Trophy, UserPlus, Users, ArrowRight } from "lucide-react";

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
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") === "challenges" ? "challenges" : "overview";

  return (
    <div className="mx-auto max-w-2xl px-4 pt-24 pb-16">
      <h1 className="font-[family-name:var(--font-geist-mono)] text-2xl font-medium text-white">
        {t("title")}
      </h1>
      {userEmail && (
        <p className="mt-1 text-sm text-white/60">{userEmail}</p>
      )}

      <Tabs defaultValue={defaultTab} className="mt-8">
        <TabsList className="bg-white/5 border border-white/10 rounded-full px-1 h-10 w-fit gap-1">
          <TabsTrigger
            value="overview"
            className="rounded-full px-4 text-white/60 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-none"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="challenges"
            className="rounded-full px-4 text-white/60 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-none"
          >
            <Trophy className="mr-1.5 h-3.5 w-3.5" />
            Challenges
          </TabsTrigger>
        </TabsList>

        {/* ── Overview tab ── */}
        <TabsContent value="overview" className="mt-6">
          {builder ? (
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
              </div>
            </section>
          ) : (
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
          )}
          <p className="mt-4 text-center">
            <Link href="/builders" className="text-sm text-white/60 hover:text-white/80">
              {t("browseDirectory")} →
            </Link>
          </p>
        </TabsContent>

        {/* ── Challenges tab ── */}
        <TabsContent value="challenges" className="mt-6 space-y-4">
          <section className="rounded-xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-[family-name:var(--font-geist-mono)] text-lg font-medium text-white">
                  Challenges
                </h2>
                <p className="mt-1 text-sm text-white/60">
                  Browse open challenges, enroll, and submit your work before the deadline.
                </p>
              </div>
              <Trophy className="mt-0.5 h-6 w-6 shrink-0 text-white/30" />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-medium uppercase tracking-widest text-white/40">
                  Active
                </p>
                <p className="mt-1 text-sm text-white/80">
                  View all open challenges and enroll.
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-medium uppercase tracking-widest text-white/40">
                  Submissions
                </p>
                <p className="mt-1 text-sm text-white/80">
                  Track and update your submissions up to the deadline.
                </p>
              </div>
            </div>

            <div className="mt-6">
              <Button asChild className="rounded-full bg-white text-black hover:bg-white/90">
                <Link href="/dashboard/challenges">
                  Browse challenges
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
