import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Link } from "@/i18n/routing";
import { MarkdownRenderer } from "../../_components/markdown-renderer";
import { SuggestUpdateButton } from "../../_components/suggest-update-button";
import { WikiSuperAdminDeleteButton } from "../../_components/wiki-super-admin-delete-button";
import { WikiHoverBorderAccent } from "../../_components/wiki-hover-surface";
import type { WikiLink } from "../../types";

const MONO: React.CSSProperties = {
  fontFamily: "var(--font-dm-mono), monospace",
};

const LINK_TYPE_LABEL: Record<string, string> = {
  tool: "TOOL",
  paper: "PAPER",
  repo: "REPO",
  video: "VIDEO",
  other: "LINK",
};

function wikiPublicFileUrl(storagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const path = storagePath.split("/").map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/wiki-public/${path}`;
}

function formatAttachmentBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/** Live pages are public to anyone who can open the route; others only author/co-authors/admins. */
async function wikiPageVisibleToRequester(
  page: { status: string; author_id: string; co_author_ids: string[] | null | undefined },
  userId: string | undefined,
  admin: ReturnType<typeof createAdminClient>
): Promise<boolean> {
  if (page.status === "live") return true;
  if (!userId) return false;
  if (userId === page.author_id) return true;
  if (page.co_author_ids?.includes(userId)) return true;
  const { data: role } = await admin.rpc("get_profile_role", { target_user_id: userId });
  return role === "admin" || role === "super_admin";
}

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  const admin = createAdminClient();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: page } = await admin
    .from("wiki_pages")
    .select("title, description, status, author_id, co_author_ids")
    .eq("slug", slug)
    .maybeSingle();
  if (!page) return {};
  const visible = await wikiPageVisibleToRequester(page, user?.id, admin);
  if (!visible) return {};
  return { title: `${page.title} — AI.SEA Wiki`, description: page.description };
}

export default async function WikiPageDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const admin = createAdminClient();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch page (any status — visibility enforced below; live-only was breaking post-submit redirect)
  const { data: page } = await admin
    .from("wiki_pages")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!page) notFound();

  const canView = await wikiPageVisibleToRequester(page, user?.id, admin);
  if (!canView) notFound();

  // Parent breadcrumb
  let parentTitle: string | null = null;
  let parentSlug: string | null = null;
  if (page.parent_id) {
    const { data: parent } = await admin
      .from("wiki_pages")
      .select("slug, title")
      .eq("id", page.parent_id)
      .maybeSingle();
    parentTitle = parent?.title ?? null;
    parentSlug = parent?.slug ?? null;
  }

  // Child pages (subsections/sub-articles)
  const { data: children } = await admin
    .from("wiki_pages")
    .select("id, slug, title, type, description, updated_at")
    .eq("parent_id", page.id)
    .eq("status", "live")
    .order("sort_order", { ascending: true });

  // Links
  const { data: links } = await admin
    .from("wiki_links")
    .select("id, url, title, description, link_type")
    .eq("page_id", page.id)
    .order("added_at", { ascending: true });

  let fileAttachments: {
    id: string;
    filename: string;
    storage_path: string;
    file_size_bytes: number;
    mime_type: string;
  }[] = [];

  if (page.type === "resource") {
    const { data: attRows } = await admin
      .from("wiki_attachments")
      .select("id, filename, storage_path, file_size_bytes, mime_type")
      .eq("page_id", page.id)
      .order("uploaded_at", { ascending: true });
    fileAttachments = attRows ?? [];
  }

  // Author info
  let authorUsername: string | null = null;
  let authorName: string | null = null;
  let authorCity: string | null = null;
  let isWikiContributor = false;
  {
    const { data: authLink } = await admin
      .from("builder_auth")
      .select("builder_id")
      .eq("user_id", page.author_id)
      .maybeSingle();
    if (authLink?.builder_id) {
      const { data: builder } = await admin
        .from("builders")
        .select("username, name, city, is_wiki_contributor")
        .eq("id", authLink.builder_id)
        .maybeSingle();
      authorUsername = builder?.username ?? null;
      authorName = builder?.name ?? null;
      authorCity = builder?.city ?? null;
      isWikiContributor = builder?.is_wiki_contributor ?? false;
    }
  }

  // Check if current user is the author or admin
  let isAuthor = false;
  let isAdmin = false;
  let isSuperAdmin = false;
  if (user) {
    isAuthor = user.id === page.author_id;
    const role = await admin.rpc("get_profile_role", { target_user_id: user.id });
    const r = role.data as string | null;
    isAdmin = r === "admin" || r === "super_admin";
    isSuperAdmin = r === "super_admin";
  }

  const { count: childPageCount } = await admin
    .from("wiki_pages")
    .select("id", { count: "exact", head: true })
    .eq("parent_id", page.id);

  const updatedAt = new Date(page.updated_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <article style={{ maxWidth: 760, margin: "0 auto", padding: "40px 28px" }}>
      {/* Breadcrumb */}
      <nav style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20 }}>
        <Link
          href="/dashboard/wiki"
          locale={locale as "en" | "id" | "zh" | "vi"}
          style={{ ...MONO, fontSize: 11, color: "var(--ds-text-muted)", textDecoration: "none" }}
        >
          Wiki
        </Link>
        {parentSlug && parentTitle && (
          <>
            <span style={{ ...MONO, fontSize: 11, color: "var(--ds-border)" }}>/</span>
            <Link
              href={`/dashboard/wiki/p/${parentSlug}` as Parameters<typeof Link>[0]["href"]}
              locale={locale as "en" | "id" | "zh" | "vi"}
              style={{ ...MONO, fontSize: 11, color: "var(--ds-text-muted)", textDecoration: "none" }}
            >
              {parentTitle}
            </Link>
          </>
        )}
        <span style={{ ...MONO, fontSize: 11, color: "var(--ds-border)" }}>/</span>
        <span style={{ ...MONO, fontSize: 11, color: "var(--ds-text-secondary)" }}>{page.title}</span>
      </nav>

      {page.status !== "live" && (
        <p style={{ ...MONO, fontSize: 12, color: "var(--ds-text-muted)", marginBottom: 16 }}>
          {page.status === "pending_review" && "Awaiting admin review — not visible in the public wiki tree yet."}
          {page.status === "draft" && "Draft — only you (and admins) can see this page."}
          {page.status === "needs_update" && "Changes were requested — edit from the wiki editor when ready."}
          {page.status === "rejected" && "This submission was rejected. You can revise and resubmit if allowed."}
        </p>
      )}

      {/* Title */}
      <h1
        style={{
          fontFamily: "var(--font-syne), sans-serif",
          fontSize: 30,
          fontWeight: 800,
          color: "var(--ds-text-primary)",
          lineHeight: 1.2,
          marginBottom: page.description ? 12 : 24,
        }}
      >
        {page.title}
      </h1>

      {page.description && (
        <p style={{ fontSize: 15, color: "var(--ds-text-muted)", marginBottom: 20, lineHeight: 1.6 }}>
          {page.description}
        </p>
      )}

      {/* Meta row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          paddingBottom: 20,
          borderBottom: "1px solid var(--ds-border)",
          marginBottom: 32,
          flexWrap: "wrap",
        }}
      >
        {authorUsername && (
          <Link
            href={`/dashboard/u/${authorUsername}` as Parameters<typeof Link>[0]["href"]}
            locale={locale as "en" | "id" | "zh" | "vi"}
            style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none" }}
          >
            {/* Avatar */}
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: "var(--ds-bg-raised)",
                border: "1px solid var(--ds-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                ...MONO,
                fontSize: 10,
                color: "var(--ds-text-muted)",
              }}
            >
              {(authorName ?? authorUsername)[0].toUpperCase()}
            </div>
            <span style={{ ...MONO, fontSize: 12, color: "var(--ds-text-secondary)" }}>
              {authorName ?? authorUsername}
            </span>
            {isWikiContributor && (
              <span
                style={{
                  ...MONO,
                  fontSize: 9,
                  padding: "1px 5px",
                  borderRadius: 3,
                  background: "var(--contributor-tag)",
                  color: "#fff",
                  letterSpacing: "0.06em",
                }}
              >
                CONTRIBUTOR
              </span>
            )}
            {authorCity && (
              <span style={{ ...MONO, fontSize: 11, color: "var(--ds-text-muted)" }}>
                {authorCity}
              </span>
            )}
          </Link>
        )}
        <span style={{ ...MONO, fontSize: 11, color: "var(--ds-text-muted)" }}>
          Updated {updatedAt}
        </span>

        {/* Edit / Admin actions */}
        <div style={{ display: "flex", gap: 8, marginLeft: "auto", alignItems: "center" }}>
          {(isAuthor || isAdmin) && (
            <Link
              href={`/dashboard/wiki/p/${slug}/edit` as Parameters<typeof Link>[0]["href"]}
              locale={locale as "en" | "id" | "zh" | "vi"}
              style={{
                ...MONO,
                fontSize: 11,
                padding: "3px 10px",
                borderRadius: 4,
                border: "1px solid var(--ds-border)",
                color: "var(--ds-text-secondary)",
                textDecoration: "none",
              }}
            >
              Edit
            </Link>
          )}
          {isSuperAdmin && (
            <WikiSuperAdminDeleteButton
              pageId={page.id}
              title={page.title}
              hasChildren={(childPageCount ?? 0) > 0}
              locale={locale}
              redirectTo={`/${locale}/dashboard/wiki`}
            />
          )}
          {/* Members (non-author) can suggest updates to live, non-section pages */}
          {user && !isAuthor && page.type !== "section" && (
            <SuggestUpdateButton slug={slug} locale={locale} />
          )}
        </div>
      </div>

      {/* Section container: show children grid instead of body */}
      {page.type === "section" ? (
        <div>
          <p style={{ ...MONO, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ds-text-muted)", marginBottom: 16 }}>
            Pages in this section
          </p>
          {(children ?? []).length === 0 ? (
            <p style={{ fontSize: 14, color: "var(--ds-text-muted)" }}>No pages yet.</p>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {(children ?? []).map((child) => (
                <Link
                  key={child.id}
                  href={`/dashboard/wiki/p/${child.slug}` as Parameters<typeof Link>[0]["href"]}
                  locale={locale as "en" | "id" | "zh" | "vi"}
                  style={{ textDecoration: "none" }}
                >
                  <WikiHoverBorderAccent
                    style={{
                      padding: "14px 16px",
                      border: "1px solid var(--ds-border)",
                      borderRadius: 8,
                      background: "var(--ds-bg-surface)",
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "var(--font-syne), sans-serif",
                        fontSize: 15,
                        fontWeight: 700,
                        color: "var(--ds-text-primary)",
                        marginBottom: 4,
                      }}
                    >
                      {child.title}
                    </p>
                    {child.description && (
                      <p style={{ fontSize: 12, color: "var(--ds-text-muted)", lineHeight: 1.5 }}>
                        {child.description}
                      </p>
                    )}
                  </WikiHoverBorderAccent>
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Body */}
          {page.body ? (
            <MarkdownRenderer body={page.body} />
          ) : (
            <p style={{ fontSize: 14, color: "var(--ds-text-muted)" }}>
              This page has no content yet.
            </p>
          )}

          {page.type === "resource" && fileAttachments.length > 0 && (
            <section style={{ marginTop: 40 }}>
              <p style={{ ...MONO, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ds-text-muted)", marginBottom: 14 }}>
                Attached files
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {fileAttachments.map((f) => (
                  <a
                    key={f.id}
                    href={wikiPublicFileUrl(f.storage_path)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: "none" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        padding: "10px 14px",
                        border: "1px solid var(--ds-border)",
                        borderRadius: 6,
                        background: "var(--ds-bg-surface)",
                      }}
                    >
                      <span style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: 14, fontWeight: 600, color: "var(--ds-text-primary)" }}>
                        {f.filename}
                      </span>
                      <span style={{ ...MONO, fontSize: 11, color: "var(--ds-text-muted)" }}>
                        {formatAttachmentBytes(f.file_size_bytes)} · ↗
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* Child pages (sub-articles) */}
          {(children ?? []).length > 0 && (
            <section style={{ marginTop: 48 }}>
              <p style={{ ...MONO, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ds-text-muted)", marginBottom: 14 }}>
                Related pages
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {(children ?? []).map((child, i) => (
                  <Link
                    key={child.id}
                    href={`/dashboard/wiki/p/${child.slug}` as Parameters<typeof Link>[0]["href"]}
                    locale={locale as "en" | "id" | "zh" | "vi"}
                    style={{ textDecoration: "none" }}
                  >
                    <div
                      style={{
                        padding: "10px 0",
                        borderTop: i === 0 ? "1px solid var(--ds-border)" : "none",
                        borderBottom: "1px solid var(--ds-border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-syne), sans-serif",
                          fontSize: 14,
                          fontWeight: 600,
                          color: "var(--ds-text-primary)",
                        }}
                      >
                        {child.title}
                      </span>
                      <span style={{ ...MONO, fontSize: 11, color: "var(--ds-text-muted)" }}>→</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* External links */}
          {(links ?? []).length > 0 && (
            <section style={{ marginTop: 48 }}>
              <p style={{ ...MONO, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ds-text-muted)", marginBottom: 14 }}>
                Resources & Links
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {(links as WikiLink[]).map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: "none" }}
                  >
                    <WikiHoverBorderAccent
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                        padding: "10px 14px",
                        border: "1px solid var(--ds-border)",
                        borderRadius: 6,
                        background: "var(--ds-bg-surface)",
                      }}
                    >
                      <span
                        style={{
                          ...MONO,
                          fontSize: 9,
                          padding: "2px 6px",
                          borderRadius: 3,
                          border: "1px solid var(--ds-border)",
                          color: "var(--ds-text-muted)",
                          flexShrink: 0,
                          marginTop: 2,
                        }}
                      >
                        {LINK_TYPE_LABEL[link.link_type] ?? "LINK"}
                      </span>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: 14, fontWeight: 600, color: "var(--ds-text-primary)", marginBottom: 2 }}>
                          {link.title}
                        </p>
                        {link.description && (
                          <p style={{ fontSize: 12, color: "var(--ds-text-muted)" }}>{link.description}</p>
                        )}
                      </div>
                      <span style={{ ...MONO, fontSize: 11, color: "var(--ds-text-muted)", flexShrink: 0, marginTop: 2 }}>↗</span>
                    </WikiHoverBorderAccent>
                  </a>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </article>
  );
}
