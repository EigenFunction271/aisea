"use client";

import { useMemo, useState, useTransition } from "react";
import { Link } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/client";
import { enrollInChallenge } from "@/lib/challenges/edge-functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ChallengeCard, UserChallengeAccess } from "./types";

function stateLabel(state: ChallengeCard["enrollment_state"]) {
  switch (state) {
    case "enrolled":
      return "Enrolled";
    case "submitted":
      return "Submitted";
    case "closed":
      return "Closed";
    case "archived":
      return "Archived";
    default:
      return "Not Enrolled";
  }
}

function canInteract(access: UserChallengeAccess) {
  return access.isAuthenticated && access.isProfileComplete;
}

function isDeadlinePassed(endAt: string) {
  return new Date(endAt).getTime() <= Date.now();
}

export function ChallengesList({
  active,
  archived,
  access,
  locale,
}: {
  active: ChallengeCard[];
  archived: ChallengeCard[];
  access: UserChallengeAccess;
  locale: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());

  const locked = !canInteract(access);
  const loginHref = `/${locale}/login?next=/${locale}/dashboard/challenges`;
  const ctaHref = access.isAuthenticated ? "/dashboard/create-profile" : loginHref;
  const ctaLabel = access.isAuthenticated ? "Complete profile to unlock" : "Sign in to unlock challenges";

  const allActive = useMemo(
    () =>
      active.map((challenge) => ({
        ...challenge,
        enrollment_state: enrolledIds.has(challenge.id) ? "enrolled" : challenge.enrollment_state,
      })),
    [active, enrolledIds]
  );

  function handleEnroll(challengeId: string) {
    setEnrollError(null);
    setEnrollingId(challengeId);
    startTransition(async () => {
      try {
        const supabase = createClient();
        await enrollInChallenge(supabase, challengeId);
        setEnrolledIds((prev) => new Set(prev).add(challengeId));
      } catch (error) {
        setEnrollError(error instanceof Error ? error.message : "Failed to enroll");
      } finally {
        setEnrollingId(null);
      }
    });
  }

  return (
    <div className="mt-8">
      <Tabs defaultValue="active">
        <TabsList className="bg-white/10 text-white/70">
          <TabsTrigger value="active" className="data-[state=active]:bg-white data-[state=active]:text-black">
            All Challenges
          </TabsTrigger>
          <TabsTrigger value="archived" className="data-[state=active]:bg-white data-[state=active]:text-black">
            Archived
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          {allActive.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
              <p className="text-white">No active challenges yet.</p>
              <p className="mt-2 text-sm text-white/60">New opportunities from the team will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {allActive.map((challenge) => (
              <Card key={challenge.id} className="overflow-hidden border-white/10 bg-white/5 py-0 text-white">
                <CardHeader className="pb-0">
                  <div
                    className="h-32 w-full rounded-lg bg-gradient-to-r from-blue-500/50 via-indigo-500/40 to-violet-500/50"
                    style={
                      challenge.hero_image_url
                        ? {
                            backgroundImage: `url(${challenge.hero_image_url})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }
                        : undefined
                    }
                  />
                  <CardTitle className={`pt-2 text-lg ${locked ? "blur-sm" : ""}`}>{challenge.title}</CardTitle>
                  <p className={`text-sm text-white/70 ${locked ? "blur-sm" : ""}`}>{challenge.subtitle}</p>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  <div className={`flex flex-wrap gap-2 ${locked ? "blur-sm" : ""}`}>
                    <Badge variant="secondary">{stateLabel(challenge.enrollment_state)}</Badge>
                    <Badge variant="outline" className="border-white/20 text-white/80">
                      Ends {new Date(challenge.end_at).toLocaleDateString()}
                    </Badge>
                    {isDeadlinePassed(challenge.end_at) ? (
                      <Badge variant="outline" className="border-amber-400/40 text-amber-300">
                        Deadline passed
                      </Badge>
                    ) : null}
                  </div>
                  <p className={`text-xs text-white/60 ${locked ? "blur-sm" : ""}`}>Host: {challenge.host_name}</p>
                  <p className={`text-xs text-white/60 ${locked ? "blur-sm" : ""}`}>Reward: {challenge.reward_text}</p>
                </CardContent>
                <CardFooter className="flex flex-wrap gap-2 pb-4">
                  <Button asChild size="sm" className="rounded-full">
                    <Link href={`/dashboard/challenges/${challenge.id}`}>View Challenge</Link>
                  </Button>
                  {!locked && challenge.enrollment_state === "not_enrolled" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full border-white/20 text-white hover:bg-white/10"
                      onClick={() => handleEnroll(challenge.id)}
                      disabled={isPending || enrollingId === challenge.id || isDeadlinePassed(challenge.end_at)}
                    >
                      {enrollingId === challenge.id ? "Enrolling..." : "Enroll"}
                    </Button>
                  )}
                  {!locked && challenge.enrollment_state === "enrolled" && (
                    <Button asChild size="sm" variant="outline" className="rounded-full border-white/20 text-white hover:bg-white/10">
                      <Link href={`/dashboard/challenges/${challenge.id}`}>Submit</Link>
                    </Button>
                  )}
                  {!locked && challenge.enrollment_state === "submitted" && (
                    <Button asChild size="sm" variant="outline" className="rounded-full border-white/20 text-white hover:bg-white/10">
                      <Link href={`/dashboard/challenges/${challenge.id}`}>Edit Submission</Link>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
            </div>
          )}
          {enrollError ? <p className="mt-3 text-sm text-red-400">{enrollError}</p> : null}
        </TabsContent>

        <TabsContent value="archived" className="mt-4">
          {archived.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
              <p className="text-white">No archived challenges yet.</p>
              <p className="mt-2 text-sm text-white/60">Completed challenge history will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {archived.map((challenge) => (
              <Card key={challenge.id} className="overflow-hidden border-white/10 bg-white/5 py-0 text-white">
                <CardHeader className="pb-0">
                  <div
                    className="h-32 w-full rounded-lg bg-gradient-to-r from-fuchsia-500/40 to-purple-500/40"
                    style={
                      challenge.hero_image_url
                        ? {
                            backgroundImage: `url(${challenge.hero_image_url})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }
                        : undefined
                    }
                  />
                  <CardTitle className={`pt-2 text-lg ${locked ? "blur-sm" : ""}`}>{challenge.title}</CardTitle>
                  <p className={`text-sm text-white/70 ${locked ? "blur-sm" : ""}`}>{challenge.subtitle}</p>
                </CardHeader>
                <CardContent className="pt-0">
                  <Badge variant="secondary">Archived</Badge>
                </CardContent>
                <CardFooter className="pb-4">
                  <Button asChild size="sm" className="rounded-full">
                    <Link href={`/dashboard/challenges/${challenge.id}`}>View Challenge</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {locked ? (
        <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-white/70">
            Challenge content is locked until you sign in and complete your dashboard profile (bio, username,
            name, country).
          </p>
          <Button asChild className="mt-3 rounded-full">
            <Link href={ctaHref}>{ctaLabel}</Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
