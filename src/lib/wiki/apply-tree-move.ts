import type { WikiPageType, WikiTreeNode } from "@/app/[locale]/dashboard/wiki/types";

export type WikiTreeDropPlacement = "before" | "after" | "inside";

/** DOM rect + pointer Y (viewport) → drop band for wiki tree rows. */
export function resolveWikiTreeDropZone(
  overRect: { top: number; height: number },
  pointerClientY: number,
  overType: WikiPageType
): WikiTreeDropPlacement {
  const h = overRect.height > 0 ? overRect.height : 1;
  const y = pointerClientY - overRect.top;
  const t = Math.min(1, Math.max(0, y / h));
  if (overType === "section") {
    if (t < 1 / 3) return "before";
    if (t < 2 / 3) return "inside";
    return "after";
  }
  return t < 0.5 ? "before" : "after";
}

/** All node ids in the subtree under `rootId` (not including `rootId`). */
function collectDescendantIds(nodes: WikiTreeNode[], rootId: string): Set<string> {
  const out = new Set<string>();
  function walk(id: string) {
    for (const n of nodes) {
      if (n.parent_id === id) {
        out.add(n.id);
        walk(n.id);
      }
    }
  }
  walk(rootId);
  return out;
}

function recomputeHasChildren(nodes: WikiTreeNode[]): WikiTreeNode[] {
  const parentIds = new Set(nodes.map((n) => n.parent_id).filter(Boolean));
  return nodes.map((n) => ({ ...n, has_children: parentIds.has(n.id) }));
}

type InsertMode = { kind: "append_end" } | { kind: "before_id"; refId: string } | { kind: "after_id"; refId: string };

function computeInsertIndex(siblings: WikiTreeNode[], mode: InsertMode): number {
  if (mode.kind === "append_end") return siblings.length;
  const idx = siblings.findIndex((s) => s.id === mode.refId);
  if (idx === -1) return siblings.length;
  return mode.kind === "before_id" ? idx : idx + 1;
}

/**
 * Move `activeId` relative to `overId` using pointer bands:
 * - **Section**: top third = sibling before section, middle = nest inside, bottom = sibling after section.
 * - **Other types**: top half = before that page, bottom half = after.
 */
export function applyWikiTreeMove(
  nodes: WikiTreeNode[],
  activeId: string,
  overId: string,
  placement: WikiTreeDropPlacement
): WikiTreeNode[] {
  if (activeId === overId) return nodes;

  const active = nodes.find((n) => n.id === activeId);
  const over = nodes.find((n) => n.id === overId);
  if (!active || !over) return nodes;

  const subtreeUnderActive = collectDescendantIds(nodes, activeId);
  if (subtreeUnderActive.has(overId)) return nodes;

  let effectivePlacement: WikiTreeDropPlacement = placement;
  if (over.type !== "section" && placement === "inside") {
    effectivePlacement = "after";
  }

  let newParentId: string | null;
  let insertMode: InsertMode;

  if (over.type === "section") {
    if (effectivePlacement === "inside") {
      newParentId = over.id;
      insertMode = { kind: "append_end" };
    } else if (effectivePlacement === "before") {
      newParentId = over.parent_id;
      insertMode = { kind: "before_id", refId: over.id };
    } else {
      newParentId = over.parent_id;
      insertMode = { kind: "after_id", refId: over.id };
    }
  } else {
    if (effectivePlacement === "before") {
      newParentId = over.parent_id;
      insertMode = { kind: "before_id", refId: over.id };
    } else {
      newParentId = over.parent_id;
      insertMode = { kind: "after_id", refId: over.id };
    }
  }

  const invalidParents = new Set<string>([activeId, ...subtreeUnderActive]);
  if (newParentId !== null && invalidParents.has(newParentId)) return nodes;

  const copy = nodes.map((n) => ({ ...n }));
  const activeNode = copy.find((n) => n.id === activeId);
  if (!activeNode) return nodes;

  const oldParentId = activeNode.parent_id;

  const siblingsExcludingActive = (parentId: string | null) =>
    copy
      .filter((n) => n.parent_id === parentId && n.id !== activeId)
      .sort((a, b) => a.sort_order - b.sort_order);

  const newSiblings = siblingsExcludingActive(newParentId);
  const insertIndex = computeInsertIndex(newSiblings, insertMode);

  const orderedIds = newSiblings.map((n) => n.id);
  orderedIds.splice(insertIndex, 0, activeId);

  for (let i = 0; i < orderedIds.length; i++) {
    const n = copy.find((x) => x.id === orderedIds[i]);
    if (n) {
      n.parent_id = newParentId;
      n.sort_order = i;
    }
  }

  if (oldParentId !== newParentId) {
    const oldSibs = copy
      .filter((n) => n.parent_id === oldParentId && n.id !== activeId)
      .sort((a, b) => a.sort_order - b.sort_order);
    oldSibs.forEach((n, i) => {
      n.sort_order = i;
    });
  }

  return recomputeHasChildren(copy);
}
