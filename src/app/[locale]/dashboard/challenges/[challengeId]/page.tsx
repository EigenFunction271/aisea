import { notFound } from "next/navigation";
import { Link } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DetailActions } from "./detail-actions";
import { MarkdownRenderer } from "../../wiki/_components/markdown-renderer";

async function getProfileCompleteState(userId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("is_profile_complete_for_challenges", {
    target_user_id: userId,
  });
  if (error) return false;
  return data === true;
}

const MONO: React.CSSProperties = {
  fontFamily: "var(--font-dm-mono), monospace",
};

const SYNE: React.CSSProperties = {
  fontFamily: "var(--font-syne), sans-serif",
};

const SECTION_LABEL: React.CSSProperties = {
  ...MONO,
  fontSize: 10,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "var(--ds-text-muted)",
  marginBottom: 10,
};

const DIVIDER: React.CSSProperties = {
  borderTop: "1px solid var(--ds-border)",
  margin: "28px 0",
};

const DIFFICULTY_COLORS: Record<string, { color: string; border: string }> = {
  starter: { color: "#4ade80", border: "rgba(74,222,128,0.35)" },
  builder: { color: "#fb923c", border: "rgba(251,146,60,0.35)" },
  hardcore: { color: "#f87171", border: "rgba(248,113,113,0.35)" },
};

export default async function ChallengeDetailPage({
  params,
}: {
  params: Promise<{ locale: string; challengeId: string }>;
}) {
  const { locale, challengeId } = await params;
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthenticated = Boolean(user);

  // Profile check and challenge fetch are independent — run in parallel.
  const [isProfileComplete, challengeRes] = await Promise.all([
    user ? getProfileCompleteState(user.id) : Promise.resolve(false),
    admin
      .from("challenges")
      .select(
        "id, title, subtitle, hero_image_url, status, end_at, description, eligibility, judging_rubric, external_link, tags, difficulty, host_name, org_name, reward_text"
      )
      .eq("id", challengeId)
      .in("status", ["published", "archived"])
      .maybeSingle(),
  ]);

  const { data: challenge } = challengeRes;
  const isLocked = !(isAuthenticated && isProfileComplete);

  if (!challenge) notFound();

  let enrollmentExists = false;
  let submission: {
    status: "draft" | "submitted" | "under_review" | "accepted" | "rejected" | "withdrawn";
    project_name: string | null;
    submission_url: string | null;
    submission_text: string | null;
    repo_link: string | null;
    submission_files: Array<{ path: string; mime_type: string; size_bytes: number }>;
  } | null = null;

  let participantCount = 0;
  let gallerySubmissions: Array<{
    id: string;
    submission_url: string | null;
    submission_text: string | null;
    status: string;
    submitted_at: string | null;
  }> = [];

  const isClosed = challenge.status === "archived";

  const [enrollCountRes, ...rest] = await Promise.all([
    admin
      .from("challenge_enrollments")
      .select("id", { count: "exact", head: true })
      .eq("challenge_id", challenge.id),
    user
      ? admin
          .from("challenge_enrollments")
          .select("id")
          .eq("challenge_id", challenge.id)
          .eq("user_id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    user
      ? supabase
          .from("challenge_submissions")
          .select("status, project_name, submission_url, submission_text, repo_link, submission_files")
          .eq("challenge_id", challenge.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    isClosed
      ? admin
          .from("challenge_submissions")
          .select("id, submission_url, submission_text, status, submitted_at")
          .eq("challenge_id", challenge.id)
          .in("status", ["submitted", "under_review", "accepted"])
          .order("submitted_at", { ascending: false })
          .limit(20)
      : Promise.resolve({ data: [] }),
  ]);

  participantCount = enrollCountRes.count ?? 0;
  const [enrollRes, submissionRes, galleryRes] = rest as [
    { data: { id: string } | null },
    { data: typeof submission },
    { data: typeof gallerySubmissions | null },
  ];

  enrollmentExists = Boolean(enrollRes.data);
  submission = submissionRes.data ?? null;
  gallerySubmissions = galleryRes.data ?? [];

  const canSubmit = challenge.status === "published";
  const loginHref = `/${locale}/login?next=/${locale}/dashboard/challenges/${challengeId}`;
  const unlockHref = isAuthenticated ? `/${locale}/dashboard/profile` : loginHref;

  const diffColors = challenge.difficulty ? DIFFICULTY_COLORS[challenge.difficulty] : null;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
      {/* Back */}
      <Link
        href="/dashboard/challenges"
        style={{
          ...MONO,
          fontSize: 12,
          color: "var(--ds-text-muted)",
          textDecoration: "none",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 28,
        }}
      >
        ← Back to challenges
      </Link>

      {/* Two-column grid */}
      <div
        style={{
          display: "grid",
          gap: 32,
          alignItems: "start",
        }}
        className="[grid-template-columns:1fr] lg:[grid-template-columns:1fr_300px]"
      >
        {/* ── LEFT column ───────────────────────────────────── */}
        <div>
          {/* Hero image */}
          {challenge.hero_image_url ? (
            <div
              style={{
                width: "100%",
                height: 200,
                borderRadius: 8,
                overflow: "hidden",
                marginBottom: 24,
                filter: isLocked ? "blur(8px)" : "none",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={challenge.hero_image_url}
                alt={challenge.title}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          ) : (
            <div
              style={{
                width: "100%",
                height: 160,
                borderRadius: 8,
                background: "var(--ds-bg-surface)",
                border: "1px solid var(--ds-border)",
                marginBottom: 24,
                filter: isLocked ? "blur(8px)" : "none",
              }}
            />
          )}

          {/* Status badge row */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span
              style={{
                ...MONO,
                fontSize: 10,
                letterSpacing: "0.10em",
                textTransform: "uppercase",
                padding: "3px 9px",
                borderRadius: 4,
                fontWeight: 600,
                background:
                  challenge.status === "published"
                    ? "rgba(74,222,128,0.12)"
                    : "rgba(255,255,255,0.06)",
                color:
                  challenge.status === "published" ? "#4ade80" : "var(--ds-text-muted)",
                border: `1px solid ${
                  challenge.status === "published"
                    ? "rgba(74,222,128,0.30)"
                    : "var(--ds-border)"
                }`,
              }}
            >
              {challenge.status === "published" ? "Live" : "Closed"}
            </span>

            {diffColors && challenge.difficulty && (
              <span
                style={{
                  ...MONO,
                  fontSize: 10,
                  letterSpacing: "0.10em",
                  textTransform: "uppercase",
                  padding: "3px 9px",
                  borderRadius: 4,
                  color: diffColors.color,
                  border: `1px solid ${diffColors.border}`,
                  background: "transparent",
                }}
              >
                {challenge.difficulty}
              </span>
            )}

            {challenge.tags?.slice(0, 3).map((tag: string) => (
              <span
                key={tag}
                style={{
                  ...MONO,
                  fontSize: 10,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  padding: "3px 8px",
                  borderRadius: 4,
                  color: "var(--ds-text-muted)",
                  border: "1px solid var(--ds-border)",
                }}
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Title */}
          <h1
            style={{
              ...SYNE,
              fontSize: 28,
              fontWeight: 700,
              color: "var(--ds-text-primary)",
              marginTop: 16,
              lineHeight: 1.25,
              filter: isLocked ? "blur(5px)" : "none",
              userSelect: isLocked ? "none" : "auto",
            }}
          >
            {challenge.title}
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: 15,
              color: "var(--ds-text-secondary)",
              marginTop: 8,
              lineHeight: 1.6,
              filter: isLocked ? "blur(4px)" : "none",
              userSelect: isLocked ? "none" : "auto",
            }}
          >
            {challenge.subtitle}
          </p>

          {/* Meta row */}
          <div
            style={{
              ...MONO,
              fontSize: 11,
              color: "var(--ds-text-muted)",
              marginTop: 14,
              display: "flex",
              gap: 18,
              flexWrap: "wrap",
            }}
          >
            {challenge.host_name && (
              <span>
                Host:{" "}
                <span style={{ color: "var(--ds-text-secondary)" }}>{challenge.host_name}</span>
              </span>
            )}
            {challenge.org_name && (
              <span>
                Org:{" "}
                <span style={{ color: "var(--ds-text-secondary)" }}>{challenge.org_name}</span>
              </span>
            )}
            {challenge.reward_text && (
              <span>
                Reward:{" "}
                <span style={{ color: "var(--ds-accent)" }}>{challenge.reward_text}</span>
              </span>
            )}
          </div>

          <div style={DIVIDER} />

          {/* THE BRIEF */}
          <section>
            <p style={SECTION_LABEL}>The Brief</p>
            <div
              style={{
                fontSize: 14,
                color: "var(--ds-text-secondary)",
                lineHeight: 1.75,
                filter: isLocked ? "blur(4px)" : "none",
                userSelect: isLocked ? "none" : "auto",
              }}
            >
              <MarkdownRenderer body={challenge.description ?? ""} />
            </div>
          </section>

          {!isLocked && (
            <>
              {challenge.eligibility && (
                <>
                  <div style={DIVIDER} />
                  <section>
                    <p style={SECTION_LABEL}>Eligibility</p>
                    <div
                      style={{
                        fontSize: 14,
                        color: "var(--ds-text-secondary)",
                        lineHeight: 1.75,
                      }}
                    >
                      <MarkdownRenderer body={challenge.eligibility} />
                    </div>
                  </section>
                </>
              )}

              {challenge.judging_rubric && (
                <>
                  <div style={DIVIDER} />
                  <section>
                    <p style={SECTION_LABEL}>Judging Criteria</p>
                    <div
                      style={{
                        fontSize: 14,
                        color: "var(--ds-text-secondary)",
                        lineHeight: 1.75,
                      }}
                    >
                      <MarkdownRenderer body={challenge.judging_rubric} />
                    </div>
                  </section>
                </>
              )}

              {/* External link */}
              {challenge.external_link && (
                <>
                  <div style={DIVIDER} />
                  <a
                    href={challenge.external_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      ...MONO,
                      fontSize: 12,
                      color: "var(--ds-accent)",
                      textDecoration: "none",
                    }}
                  >
                    Challenge resources ↗
                  </a>
                </>
              )}

              {/* Submissions Gallery (post-close) */}
              {isClosed && gallerySubmissions.length > 0 && (
                <>
                  <div style={DIVIDER} />
                  <section>
                    <p style={SECTION_LABEL}>Submissions Gallery</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {gallerySubmissions.map((sub) => (
                        <div
                          key={sub.id}
                          style={{
                            border: "1px solid var(--ds-border)",
                            borderRadius: 6,
                            padding: "12px 14px",
                            background: "var(--ds-bg-surface)",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 12,
                            }}
                          >
                            {sub.submission_url ? (
                              <a
                                href={sub.submission_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  ...MONO,
                                  fontSize: 12,
                                  color: "var(--ds-accent)",
                                  textDecoration: "none",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  flex: 1,
                                }}
                              >
                                {sub.submission_url}
                              </a>
                            ) : (
                              <span
                                style={{
                                  ...MONO,
                                  fontSize: 11,
                                  color: "var(--ds-text-muted)",
                                  flex: 1,
                                }}
                              >
                                No URL provided
                              </span>
                            )}
                            <span
                              style={{
                                ...MONO,
                                fontSize: 10,
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                                padding: "2px 7px",
                                borderRadius: 4,
                                color:
                                  sub.status === "accepted"
                                    ? "#4ade80"
                                    : "var(--ds-text-muted)",
                                border: `1px solid ${
                                  sub.status === "accepted"
                                    ? "rgba(74,222,128,0.30)"
                                    : "var(--ds-border)"
                                }`,
                                flexShrink: 0,
                              }}
                            >
                              {sub.status}
                            </span>
                          </div>
                          {sub.submission_text && (
                            <p
                              style={{
                                fontSize: 13,
                                color: "var(--ds-text-muted)",
                                marginTop: 6,
                                overflow: "hidden",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                lineHeight: 1.5,
                              }}
                            >
                              {sub.submission_text}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                </>
              )}

              {/* Submission CTA note */}
              {(enrollmentExists || Boolean(submission)) && (
                <div>
                  <div style={DIVIDER} />
                  <p style={{ ...MONO, fontSize: 12, color: "var(--ds-text-muted)" }}>
                    {canSubmit
                      ? "Use the panel on the right to submit or edit your entry."
                      : "Submissions are closed. Use the panel on the right to view your entry."}
                  </p>
                </div>
              )}
            </>
          )}

          {/* Lock gate */}
          {isLocked && (
            <div
              style={{
                marginTop: 32,
                border: "1px solid var(--ds-border)",
                borderRadius: 8,
                background: "var(--ds-bg-surface)",
                padding: "20px 18px",
              }}
            >
              <p style={{ fontSize: 14, color: "var(--ds-text-secondary)", marginBottom: 14 }}>
                Sign in and complete your builder profile to see full details and submit.
              </p>
              <a
                href={unlockHref}
                style={{
                  ...MONO,
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "8px 18px",
                  borderRadius: 5,
                  background: "var(--ds-accent)",
                  color: "#0a0a0a",
                  textDecoration: "none",
                  display: "inline-block",
                }}
              >
                {isAuthenticated ? "Complete profile" : "Sign in →"}
              </a>
            </div>
          )}
        </div>

        {/* ── RIGHT sticky panel + submission modal ─────────── */}
        <DetailActions
          challengeId={challenge.id}
          challengeTitle={challenge.title}
          endAt={challenge.end_at}
          participantCount={participantCount}
          isLocked={isLocked}
          isEnrolled={enrollmentExists}
          hasSubmission={Boolean(submission)}
          canSubmit={canSubmit}
          locale={locale}
          initialSubmission={
            submission
              ? (() => {
                  const s = submission as unknown as Record<string, unknown>;
                  return {
                    project_name: (s.project_name as string | null) ?? null,
                    submission_url: (s.submission_url as string | null) ?? null,
                    submission_text: (s.submission_text as string | null) ?? null,
                    repo_link: (s.repo_link as string | null) ?? null,
                    status: s.status as string,
                    submission_files: (s.submission_files as Array<{ path: string; mime_type: string; size_bytes: number }>) ?? [],
                  };
                })()
              : null
          }
        />
      </div>
    </div>
  );
}
