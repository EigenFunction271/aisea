import { notFound, redirect } from "next/navigation";
import { Link } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ProfileTabs } from "./profile-tabs";
import { GitHubEnrichmentCard } from "./github-enrichment-card";
import { GitHubTags } from "./github-tags";
import { GitHubCalendarCard } from "./github-calendar";

const MONO: React.CSSProperties = {
  fontFamily: "var(--font-dm-mono), monospace",
};

const CITY_COLORS: Record<string, string> = {
  "kuala lumpur": "var(--ds-city-kl)",
  kl: "var(--ds-city-kl)",
  singapore: "var(--ds-city-sg)",
  jakarta: "var(--ds-city-jkt)",
  manila: "var(--ds-city-mnl)",
  "ho chi minh": "var(--ds-city-hcmc)",
  hcmc: "var(--ds-city-hcmc)",
  bangkok: "var(--ds-city-bkk)",
};

function cityColor(city: string): string {
  const key = city.toLowerCase();
  for (const [k, v] of Object.entries(CITY_COLORS)) {
    if (key.includes(k)) return v;
  }
  return "var(--ds-city-other)";
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function memberSince(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });
}

export default async function BuilderProfilePage({
  params,
}: {
  params: Promise<{ locale: string; handle: string }>;
}) {
  const { locale, handle } = await params;
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user: viewer },
  } = await supabase.auth.getUser();
  if (!viewer) {
    redirect(`/${locale}/login?next=/${locale}/dashboard/u/${encodeURIComponent(handle)}`);
  }

  // Single join — builder row + auth user_id in one round-trip.
  const { data: builder } = await admin
    .from("builders")
    .select(
      "id, username, name, city, bio, skills, github_handle, linkedin_url, twitter_url, instagram_url, personal_url, created_at, is_wiki_contributor, github_enriched_at, github_activity_status, github_primary_languages, github_ai_libs, github_focus_areas, builder_auth(user_id)"
    )
    .eq("username", handle)
    .maybeSingle();

  if (!builder) notFound();

  const builderUserId =
    (builder.builder_auth as unknown as { user_id: string } | null)?.user_id ?? null;
  const isOwner = Boolean(viewer && builderUserId && viewer.id === builderUserId);

  const builderSkillSlugs: string[] = Array.isArray(builder.skills)
    ? (builder.skills as string[])
    : [];

  // Parallel: enrollment count, submission list, skills, wiki page count
  const [enrollRes, submitRes, skillsRes, wikiCountRes, wikiPagesRes] = await Promise.all([
    builderUserId
      ? admin
          .from("challenge_enrollments")
          .select("id", { count: "exact", head: true })
          .eq("user_id", builderUserId)
      : Promise.resolve({ count: 0 }),
    builderUserId
      ? admin
          .from("challenge_submissions")
          .select("id, challenge_id, status, submitted_at, challenges(title)")
          .eq("user_id", builderUserId)
          .neq("status", "withdrawn")
          .order("submitted_at", { ascending: false })
          .limit(50)
      : Promise.resolve({ data: [] }),
    builderSkillSlugs.length > 0
      ? admin.from("skills").select("slug, label").in("slug", builderSkillSlugs)
      : Promise.resolve({ data: [] }),
    builderUserId
      ? admin
          .from("wiki_pages")
          .select("id", { count: "exact", head: true })
          .eq("author_id", builderUserId)
          .eq("status", "live")
      : Promise.resolve({ count: 0 }),
    // Recent live wiki pages by this author for the WIKI tab
    builderUserId
      ? admin
          .from("wiki_pages")
          .select("id, slug, title, type, updated_at")
          .eq("author_id", builderUserId)
          .eq("status", "live")
          .order("updated_at", { ascending: false })
          .limit(10)
      : Promise.resolve({ data: [] }),
  ]);

  const enrollmentCount = (enrollRes as { count: number | null }).count ?? 0;
  const wikiPageCount = (wikiCountRes as { count: number | null }).count ?? 0;
  const wikiPages = ((wikiPagesRes as { data: Array<Record<string, unknown>> | null }).data ?? []).map((p) => ({
    id: p.id as string,
    slug: p.slug as string,
    title: p.title as string,
    type: p.type as string,
    updated_at: p.updated_at as string,
  }));

  const submissions = ((submitRes as { data: Array<Record<string, unknown>> | null }).data ?? []).map((s) => ({
    id: s.id as string,
    challenge_id: s.challenge_id as string,
    challengeTitle: (s.challenges as unknown as { title: string } | null)?.title ?? "Untitled challenge",
    status: s.status as string,
    submitted_at: s.submitted_at as string | null,
  }));

  const allSkills: Array<{ slug: string; label: string }> = skillsRes.data ?? [];
  const displaySkills = allSkills.filter((s) => builderSkillSlugs.includes(s.slug));

  // GitHub enrichment fields — safe defaults if migration hasn't run yet
  const githubEnrichedAt = (builder as Record<string, unknown>).github_enriched_at as string | null ?? null;
  const githubActivityStatus = (builder as Record<string, unknown>).github_activity_status as string | null ?? null;
  const githubPrimaryLanguages: string[] = Array.isArray((builder as Record<string, unknown>).github_primary_languages)
    ? ((builder as Record<string, unknown>).github_primary_languages as string[])
    : [];
  const githubAiLibs: string[] = Array.isArray((builder as Record<string, unknown>).github_ai_libs)
    ? ((builder as Record<string, unknown>).github_ai_libs as string[])
    : [];
  const githubFocusAreas: string[] = Array.isArray((builder as Record<string, unknown>).github_focus_areas)
    ? ((builder as Record<string, unknown>).github_focus_areas as string[])
    : [];

  const color = cityColor(builder.city ?? "");

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 24px" }}>
      {/* Header card */}
      <div
        style={{
          border: "1px solid var(--ds-border)",
          borderRadius: 10,
          background: "var(--ds-bg-surface)",
          padding: "24px 24px 20px",
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
          {/* Avatar */}
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: `${color}22`,
              border: `1px solid ${color}66`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                ...MONO,
                fontSize: 16,
                fontWeight: 700,
                color: color,
              }}
            >
              {initials(builder.name)}
            </span>
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h1
                style={{
                  fontFamily: "var(--font-syne), sans-serif",
                  fontSize: 20,
                  fontWeight: 700,
                  color: "var(--ds-text-primary)",
                  margin: 0,
                }}
              >
                {builder.name}
              </h1>
              {(builder as unknown as { is_wiki_contributor: boolean }).is_wiki_contributor && (
                <span
                  style={{
                    fontFamily: "var(--font-dm-mono), monospace",
                    fontSize: 9,
                    letterSpacing: "0.08em",
                    padding: "2px 7px",
                    borderRadius: 3,
                    background: "var(--contributor-tag)",
                    color: "#fff",
                  }}
                >
                  WIKI CONTRIBUTOR
                </span>
              )}
              {isOwner && (
                <Link
                  href="/dashboard/edit-profile"
                  locale={locale as "en" | "id" | "zh" | "vi"}
                  style={{
                    ...MONO,
                    fontSize: 10,
                    letterSpacing: "0.08em",
                    color: "var(--ds-text-muted)",
                    border: "1px solid var(--ds-border)",
                    borderRadius: 4,
                    padding: "2px 8px",
                    textDecoration: "none",
                    transition: "color 0.15s",
                  }}
                >
                  Edit profile
                </Link>
              )}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginTop: 6,
                flexWrap: "wrap",
              }}
            >
              <span style={{ ...MONO, fontSize: 12, color: "var(--ds-text-muted)" }}>
                @{builder.username}
              </span>

              {/* City badge */}
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  ...MONO,
                  fontSize: 11,
                }}
              >
                <span
                  style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }}
                />
                <span style={{ color: color }}>{builder.city}</span>
              </span>

              <span style={{ ...MONO, fontSize: 11, color: "var(--ds-text-muted)" }}>
                Member since {memberSince(builder.created_at)}
              </span>
            </div>

            {builder.bio && (
              <p
                style={{
                  fontSize: 13,
                  color: "var(--ds-text-secondary)",
                  marginTop: 10,
                  lineHeight: 1.55,
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {builder.bio}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div
        style={{
          display: "flex",
          gap: 0,
          borderTop: "1px solid var(--ds-border)",
          borderBottom: "1px solid var(--ds-border)",
          marginBottom: 20,
        }}
      >
        {[
          { label: "Enrolled", value: enrollmentCount },
          { label: "Submissions", value: submissions.length },
          { label: "Wiki pages", value: wikiPageCount },
          { label: "Node", value: builder.city },
        ].map((stat, i) => (
          <div
            key={stat.label}
            style={{
              flex: 1,
              padding: "12px 0",
              paddingLeft: i === 0 ? 0 : 20,
              borderLeft: i > 0 ? "1px solid var(--ds-border)" : "none",
              marginLeft: i > 0 ? 20 : 0,
            }}
          >
            <p style={{ ...MONO, fontSize: 10, letterSpacing: "0.10em", textTransform: "uppercase" as const, color: "var(--ds-text-muted)", marginBottom: 4 }}>
              {stat.label}
            </p>
            <p
              style={{
                ...MONO,
                fontSize: 18,
                fontWeight: 700,
                color: stat.label === "Node" ? color : "var(--ds-text-primary)",
              }}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Skills */}
      {displaySkills.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
          {displaySkills.map((skill) => (
            <span
              key={skill.slug}
              style={{
                ...MONO,
                fontSize: 10,
                letterSpacing: "0.08em",
                textTransform: "uppercase" as const,
                padding: "4px 10px",
                borderRadius: 4,
                color: "var(--ds-accent)",
                border: "1px solid rgba(0,255,180,0.25)",
                background: "rgba(0,255,180,0.06)",
              }}
            >
              {skill.label}
            </span>
          ))}
        </div>
      )}

      {/* GitHub enrichment tags — visible to everyone if enriched */}
      <GitHubTags
        activityStatus={githubActivityStatus}
        primaryLanguages={githubPrimaryLanguages}
        aiLibs={githubAiLibs}
        focusAreas={githubFocusAreas}
      />

      {/* GitHub contribution calendar — visible to everyone if handle is set */}
      {builder.github_handle && (
        <GitHubCalendarCard githubHandle={builder.github_handle} />
      )}

      {/* GitHub enrichment card — owner only */}
      {isOwner && (
        <GitHubEnrichmentCard
          builderId={builder.id}
          githubHandle={builder.github_handle ?? null}
          initialEnrichedAt={githubEnrichedAt}
        />
      )}

      {/* Tabs */}
      <ProfileTabs
        submissions={submissions}
        wikiPages={wikiPages}
        social={{
          bio: builder.bio,
          github_handle: builder.github_handle,
          linkedin_url: builder.linkedin_url,
          twitter_url: builder.twitter_url,
          instagram_url: builder.instagram_url,
          personal_url: builder.personal_url,
        }}
        locale={locale}
        challengesPath={`/${locale}/dashboard/challenges`}
      />
    </div>
  );
}
