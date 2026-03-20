"use client";

import { useState, useMemo, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Link } from "@/i18n/routing";
import type { WikiTreeNode, WikiPageType } from "../types";

const MONO: React.CSSProperties = {
  fontFamily: "var(--font-dm-mono), monospace",
};

const TYPE_ICON: Record<WikiPageType, string> = {
  guide: "▤",
  reference: "≡",
  resource: "⊞",
  section: "▸",
};

function buildTree(
  nodes: WikiTreeNode[],
  parentId: string | null
): WikiTreeNode[] {
  return nodes
    .filter((n) => n.parent_id === parentId)
    .sort((a, b) => a.sort_order - b.sort_order);
}

function TreeItem({
  node,
  allNodes,
  depth,
  activeSlug,
  locale,
  expandedIds,
  onToggle,
}: {
  node: WikiTreeNode;
  allNodes: WikiTreeNode[];
  depth: number;
  activeSlug: string | null;
  locale: string;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
}) {
  const children = buildTree(allNodes, node.id);
  const hasChildren = children.length > 0;
  const isExpanded = expandedIds.has(node.id);
  const isActive = activeSlug === node.slug;

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          paddingLeft: depth * 16 + 8,
          paddingRight: 8,
          height: 28,
          borderRadius: 4,
          background: isActive ? "var(--wiki-tree-active)" : "transparent",
          borderLeft: isActive ? "2px solid var(--ds-accent)" : "2px solid transparent",
          transition: "background 0.1s",
          cursor: "pointer",
        }}
        onMouseEnter={(e) =>
          !isActive && ((e.currentTarget as HTMLDivElement).style.background = "var(--wiki-tree-hover)")
        }
        onMouseLeave={(e) =>
          !isActive && ((e.currentTarget as HTMLDivElement).style.background = "transparent")
        }
      >
        {/* Expand/collapse toggle */}
        <button
          onClick={(e) => {
            e.preventDefault();
            if (hasChildren) onToggle(node.id);
          }}
          style={{
            width: 14,
            height: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            background: "transparent",
            border: "none",
            cursor: hasChildren ? "pointer" : "default",
            color: "var(--ds-text-muted)",
            fontSize: 9,
            padding: 0,
          }}
        >
          {hasChildren ? (isExpanded ? "▼" : "▶") : ""}
        </button>

        {/* Type icon */}
        <span style={{ ...MONO, fontSize: 10, color: "var(--ds-text-muted)", flexShrink: 0 }}>
          {TYPE_ICON[node.type]}
        </span>

        {/* Title link */}
        <Link
          href={`/dashboard/wiki/p/${node.slug}` as Parameters<typeof Link>[0]["href"]}
          locale={locale as "en" | "id" | "zh" | "vi"}
          style={{
            ...MONO,
            fontSize: 12,
            color: isActive ? "var(--ds-text-primary)" : "var(--ds-text-secondary)",
            textDecoration: "none",
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {node.title}
        </Link>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {children.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              allNodes={allNodes}
              depth={depth + 1}
              activeSlug={activeSlug}
              locale={locale}
              expandedIds={expandedIds}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function WikiTreePanel({
  nodes,
  locale,
}: {
  nodes: WikiTreeNode[];
  locale: string;
}) {
  const pathname = usePathname();

  // Derive active slug from pathname /wiki/p/[slug]
  const activeSlug = useMemo(() => {
    const match = pathname.match(/\/wiki\/p\/([^/]+)/);
    return match ? match[1] : null;
  }, [pathname]);

  // Expand ancestors of active page on mount
  const ancestorIds = useMemo(() => {
    if (!activeSlug) return new Set<string>();
    const active = nodes.find((n) => n.slug === activeSlug);
    if (!active) return new Set<string>();
    const ids = new Set<string>();
    let current = nodes.find((n) => n.id === active.parent_id);
    while (current) {
      ids.add(current.id);
      current = nodes.find((n) => n.id === current!.parent_id);
    }
    return ids;
  }, [activeSlug, nodes]);

  const [expandedIds, setExpandedIds] = useState<Set<string>>(ancestorIds);
  const [search, setSearch] = useState("");

  // Keep ancestors expanded when active page changes
  useEffect(() => {
    setExpandedIds((prev) => new Set([...prev, ...ancestorIds]));
  }, [ancestorIds]);

  function toggleNode(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Filter nodes by search query
  const filteredNodes = useMemo(() => {
    if (!search.trim()) return nodes;
    const q = search.toLowerCase();
    const matched = new Set(
      nodes.filter((n) => n.title.toLowerCase().includes(q)).map((n) => n.id)
    );
    // Include all ancestors of matched nodes
    const withAncestors = new Set(matched);
    for (const node of nodes) {
      if (matched.has(node.id)) {
        let current = nodes.find((n) => n.id === node.parent_id);
        while (current) {
          withAncestors.add(current.id);
          current = nodes.find((n) => n.id === current!.parent_id);
        }
      }
    }
    return nodes.filter((n) => withAncestors.has(n.id));
  }, [nodes, search]);

  // When searching, expand all matched ancestors
  const searchExpandedIds = useMemo(() => {
    if (!search.trim()) return expandedIds;
    const all = new Set<string>(filteredNodes.map((n) => n.id));
    return all;
  }, [search, filteredNodes, expandedIds]);

  const rootNodes = buildTree(filteredNodes, null);
  const activeExpandedIds = search.trim() ? searchExpandedIds : expandedIds;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px 12px 8px",
          borderBottom: "1px solid var(--ds-border)",
        }}
      >
        <p style={{ ...MONO, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ds-text-muted)", marginBottom: 8 }}>
          Wiki
        </p>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && setSearch("")}
          placeholder="Search pages…"
          style={{
            ...MONO,
            fontSize: 12,
            width: "100%",
            padding: "5px 8px",
            background: "var(--ds-bg-raised)",
            border: "1px solid var(--ds-border)",
            borderRadius: 4,
            color: "var(--ds-text-secondary)",
            outline: "none",
          }}
        />
      </div>

      {/* Tree */}
      <div style={{ flex: 1, overflowY: "auto", padding: "6px 4px" }}>
        {rootNodes.length === 0 ? (
          <p style={{ ...MONO, fontSize: 11, color: "var(--ds-text-muted)", padding: "12px 12px" }}>
            {search ? "No pages match." : "No pages yet."}
          </p>
        ) : (
          rootNodes.map((node) => (
            <TreeItem
              key={node.id}
              node={node}
              allNodes={filteredNodes}
              depth={0}
              activeSlug={activeSlug}
              locale={locale}
              expandedIds={activeExpandedIds}
              onToggle={toggleNode}
            />
          ))
        )}
      </div>

      {/* New page CTA */}
      <div style={{ padding: "8px 12px", borderTop: "1px solid var(--ds-border)" }}>
        <Link
          href="/dashboard/wiki/new"
          locale={locale as "en" | "id" | "zh" | "vi"}
          style={{
            ...MONO,
            fontSize: 11,
            color: "var(--ds-accent)",
            textDecoration: "none",
            letterSpacing: "0.04em",
          }}
        >
          + New page
        </Link>
      </div>
    </div>
  );
}
