import { notFound } from "next/navigation";
import { Link } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ProfileTabs } from "./profile-tabs";

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
  return new Date(iso).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

const SKILL_TAXONOMY = [
  "llm-engineering",
  "agentic-systems",
  "rag",
  "fine-tuning",
  "deployment-infra",
  "product",
  "data-engineering",
  "frontend",
  "hardware-edge",
  "research",
];

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

  // Fetch builder
  const { data: builder } = await admin
    .from("builders")
    .select(
      "id, username, name, city, bio, skills, github_handle, linkedin_url, twitter_url, instagram_url, personal_url, created_at"
    )
    .eq("username", handle)
    .maybeSingle();

  if (!builder) notFound();

  // Find builder's auth user_id
  const { data: builderAuth } = await admin
    .from("builder_auth")
    .select("user_id")
    .eq("builder_id", builder.id)
    .maybeSingle();

  const builderUserId = builderAuth?.user_id ?? null;
  const isOwner = Boolean(viewer && builderUserId && viewer.id === builderUserId);

  // Parallel: enrollment count, submission list with challenge titles
  const [enrollRes, submitRes, skillsRes] = await Promise.all([
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
    admin.from("skills").select("slug, label").in("slug", SKILL_TAXONOMY),
  ]);

  const enrollmentCount = (enrollRes as { count: number | null }).count ?? 0;

  const submissions = ((submitRes as { data: Array<Record<string, unknown>> | null }).data ?? []).map((s) => ({
    id: s.id as string,
    challenge_id: s.challenge_id as string,
    challengeTitle: (s.challenges as unknown as { title: string } | null)?.title ?? "Untitled challenge",
    status: s.status as string,
    submitted_at: s.submitted_at as string | null,
  }));

  const allSkills: Array<{ slug: string; label: string }> = skillsRes.data ?? [];
  const builderSkillSlugs: string[] = Array.isArray(builder.skills) ? (builder.skills as string[]) : [];
  const displaySkills = allSkills.filter((s) => builderSkillSlugs.includes(s.slug));

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
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 28 }}>
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

      {/* Tabs */}
      <ProfileTabs
        submissions={submissions}
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
