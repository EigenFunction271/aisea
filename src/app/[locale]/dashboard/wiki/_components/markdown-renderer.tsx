// Server component — no "use client".
// react-markdown v9+ is RSC-compatible; highlight.js runs at request time and
// the pre-highlighted HTML is streamed to the client. Zero markdown JS shipped.
// The highlight.js CSS is imported in wiki/layout.tsx so it is available globally.
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeHighlight from "rehype-highlight";

const CODE_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-dm-mono), monospace",
  background: "var(--wiki-code-bg)",
  borderRadius: 5,
  border: "1px solid var(--ds-border)",
  padding: "1em 1.25em",
  fontSize: "0.82em",
  overflowX: "auto",
  lineHeight: 1.6,
};

const INLINE_CODE_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-dm-mono), monospace",
  background: "var(--ds-bg-raised)",
  borderRadius: 3,
  padding: "0.15em 0.4em",
  fontSize: "0.85em",
  color: "var(--ds-accent)",
};

export function MarkdownRenderer({ body }: { body: string }) {
  function sanitizeLinkUri(uri: string | undefined) {
    const raw = (uri ?? "").trim();
    if (!raw) return "#";

    // Safe allowlist:
    // - same-origin absolute paths: "/something"
    // - hash links: "#section"
    // - relative paths: "./foo" / "../foo"
    // - external links over HTTP(S)
    if (raw.startsWith("#")) return raw;
    if (raw.startsWith("/")) return raw.startsWith("//") ? "#" : raw;
    if (raw.startsWith("./") || raw.startsWith("../")) return raw;
    if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;

    // Everything else (javascript:, data:, mailto:, etc.) is rejected.
    return "#";
  }

  return (
    <div
      style={{
        fontFamily: "var(--font-geist-sans), sans-serif",
        fontSize: 14,
        lineHeight: 1.8,
        color: "var(--ds-text-secondary)",
        maxWidth: "100%",
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSlug, rehypeHighlight]}
        components={{
          h1: ({ children }) => (
            <h1
              style={{
                fontFamily: "var(--font-syne), sans-serif",
                fontSize: 26,
                fontWeight: 800,
                color: "var(--ds-text-primary)",
                margin: "1.5em 0 0.5em",
                lineHeight: 1.25,
              }}
            >
              {children}
            </h1>
          ),
          h2: ({ children, id }) => (
            <h2
              id={id}
              style={{
                fontFamily: "var(--font-syne), sans-serif",
                fontSize: 20,
                fontWeight: 700,
                color: "var(--ds-text-primary)",
                margin: "1.8em 0 0.5em",
                paddingBottom: 6,
                borderBottom: "1px solid var(--ds-border)",
                lineHeight: 1.3,
              }}
            >
              {children}
            </h2>
          ),
          h3: ({ children, id }) => (
            <h3
              id={id}
              style={{
                fontFamily: "var(--font-syne), sans-serif",
                fontSize: 16,
                fontWeight: 700,
                color: "var(--ds-text-primary)",
                margin: "1.4em 0 0.4em",
              }}
            >
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p style={{ margin: "0.75em 0" }}>{children}</p>
          ),
          a: ({ href, children }) => {
            const safeHref = sanitizeLinkUri(typeof href === "string" ? href : undefined);
            const isExternal = safeHref.startsWith("http://") || safeHref.startsWith("https://");
            return (
            <a
              href={safeHref}
              target={isExternal ? "_blank" : undefined}
              rel={isExternal ? "noopener noreferrer" : undefined}
              style={{ color: "var(--ds-accent)", textUnderlineOffset: 3 }}
            >
              {children}
            </a>
            );
          },
          code: (props) => {
            const { className, children } = props as { className?: string; children?: React.ReactNode };
            const isBlock = /language-/.test(className ?? "");
            if (isBlock) {
              return (
                <code className={className} style={CODE_STYLE}>
                  {children}
                </code>
              );
            }
            return <code style={INLINE_CODE_STYLE}>{children}</code>;
          },
          pre: ({ children }) => (
            <pre
              style={{
                ...CODE_STYLE,
                padding: 0,
                background: "var(--wiki-code-bg)",
                border: "1px solid var(--ds-border)",
                borderRadius: 5,
                margin: "1em 0",
              }}
            >
              {children}
            </pre>
          ),
          ul: ({ children }) => (
            <ul style={{ paddingLeft: "1.4em", margin: "0.6em 0" }}>{children}</ul>
          ),
          ol: ({ children }) => (
            <ol style={{ paddingLeft: "1.4em", margin: "0.6em 0" }}>{children}</ol>
          ),
          li: ({ children }) => (
            <li style={{ margin: "0.25em 0" }}>{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote
              style={{
                borderLeft: "3px solid var(--ds-accent)",
                margin: "1em 0",
                padding: "0.5em 1em",
                background: "var(--wiki-callout-bg)",
                borderRadius: "0 5px 5px 0",
                color: "var(--ds-text-secondary)",
              }}
            >
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div style={{ overflowX: "auto", margin: "1em 0" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 13,
                  fontFamily: "var(--font-dm-mono), monospace",
                }}
              >
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th
              style={{
                borderBottom: "1px solid var(--ds-border)",
                padding: "6px 12px",
                textAlign: "left",
                color: "var(--ds-text-muted)",
                fontSize: 11,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td
              style={{
                borderBottom: "1px solid var(--ds-border-subtle)",
                padding: "6px 12px",
                color: "var(--ds-text-secondary)",
              }}
            >
              {children}
            </td>
          ),
          hr: () => (
            <hr style={{ border: "none", borderTop: "1px solid var(--ds-border)", margin: "2em 0" }} />
          ),
        }}
      >
        {body}
      </ReactMarkdown>
    </div>
  );
}
