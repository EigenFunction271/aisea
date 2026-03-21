"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { WikiTreeNode } from "../types";
import { WikiSuperAdminDeleteButton } from "./wiki-super-admin-delete-button";

const MONO: React.CSSProperties = {
  fontFamily: "var(--font-dm-mono), monospace",
};

type FlatNode = WikiTreeNode & { depth: number };

function flattenTree(
  nodes: WikiTreeNode[],
  parentId: string | null,
  depth: number
): FlatNode[] {
  const children = nodes
    .filter((n) => n.parent_id === parentId)
    .sort((a, b) => a.sort_order - b.sort_order);
  return children.flatMap((n) => [
    { ...n, depth },
    ...flattenTree(nodes, n.id, depth + 1),
  ]);
}

function SortableRow({
  node,
  isDragging,
  isSuperAdmin,
  locale,
}: {
  node: FlatNode;
  isDragging: boolean;
  isSuperAdmin: boolean;
  locale: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: node.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    display: "flex",
    alignItems: "center",
    gap: 8,
    paddingLeft: node.depth * 20 + 12,
    paddingRight: 12,
    minHeight: 32,
    background: "var(--ds-bg-base)",
    borderBottom: "1px solid var(--ds-border-subtle)",
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div
        {...attributes}
        {...listeners}
        style={{
          cursor: "grab",
          display: "flex",
          alignItems: "center",
          gap: 8,
          flex: 1,
          minWidth: 0,
          padding: "4px 0",
        }}
      >
        <span style={{ ...MONO, fontSize: 10, color: "var(--ds-text-muted)", flexShrink: 0 }}>⠿</span>
        <span style={{ ...MONO, fontSize: 12, color: "var(--ds-text-secondary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {node.title}
        </span>
        <span style={{ ...MONO, fontSize: 9, color: "var(--ds-text-muted)", flexShrink: 0 }}>
          {node.type}
        </span>
      </div>
      {isSuperAdmin && (
        <WikiSuperAdminDeleteButton
          pageId={node.id}
          title={node.title}
          hasChildren={node.has_children}
          locale={locale}
          redirectTo={`/${locale}/dashboard/wiki/admin`}
        />
      )}
    </div>
  );
}

export function AdminTreeManager({
  initialNodes,
  locale,
  isSuperAdmin = false,
}: {
  initialNodes: WikiTreeNode[];
  locale: string;
  isSuperAdmin?: boolean;
}) {
  const [nodes, setNodes] = useState<WikiTreeNode[]>(initialNodes);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const flat = flattenTree(nodes, null, 0);

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string);
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const activeNode = nodes.find((n) => n.id === active.id);
    const overNode = nodes.find((n) => n.id === over.id);
    if (!activeNode || !overNode) return;

    // Re-parent: active takes same parent as over, and inserts after over
    const newParentId = overNode.parent_id;

    setNodes((prev) => {
      const siblings = prev
        .filter((n) => n.id !== active.id && n.parent_id === newParentId)
        .sort((a, b) => a.sort_order - b.sort_order);

      // Insert active after 'over' in siblings
      const overIdx = siblings.findIndex((n) => n.id === over.id);
      const insertAt = overIdx === -1 ? siblings.length : overIdx + 1;
      siblings.splice(insertAt, 0, { ...activeNode, parent_id: newParentId });

      const updated = siblings.map((n, i) => ({ ...n, sort_order: i }));

      return prev.map((n) => {
        const match = updated.find((u) => u.id === n.id);
        return match ?? n;
      });
    });
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over || active.id === over.id) return;
  }

  const saveTree = useCallback(async () => {
    setSaveState("saving");
    try {
      const updates = nodes.map((n) => ({
        id: n.id,
        parent_id: n.parent_id,
        sort_order: n.sort_order,
      }));
      const res = await fetch("/api/wiki/reorder-tree", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    } catch {
      setSaveState("error");
    }
  }, [nodes]);

  const activeNode = flat.find((n) => n.id === activeId);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <p style={{ ...MONO, fontSize: 11, color: "var(--ds-text-muted)" }}>
          Drag rows to reorder. Changes are saved with the button below.
        </p>
        <button
          onClick={saveTree}
          disabled={saveState === "saving"}
          style={{
            ...MONO,
            fontSize: 12,
            padding: "6px 16px",
            borderRadius: 5,
            border: "1px solid var(--ds-accent)",
            background: "transparent",
            color: "var(--ds-accent)",
            cursor: "pointer",
            opacity: saveState === "saving" ? 0.5 : 1,
          }}
        >
          {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved ✓" : saveState === "error" ? "Error" : "Save tree"}
        </button>
      </div>

      <div
        style={{
          border: "1px solid var(--ds-border)",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
        >
          <SortableContext
            items={flat.map((n) => n.id)}
            strategy={verticalListSortingStrategy}
          >
            {flat.map((node) => (
              <SortableRow
                key={node.id}
                node={node}
                isDragging={node.id === activeId}
                isSuperAdmin={isSuperAdmin}
                locale={locale}
              />
            ))}
          </SortableContext>

          <DragOverlay>
            {activeNode ? (
              <div
                style={{
                  ...MONO,
                  fontSize: 12,
                  padding: "6px 16px",
                  background: "var(--ds-bg-raised)",
                  border: "1px solid var(--ds-accent)",
                  borderRadius: 4,
                  color: "var(--ds-text-primary)",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                  cursor: "grabbing",
                }}
              >
                {activeNode.title}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
