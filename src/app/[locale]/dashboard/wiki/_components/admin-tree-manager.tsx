"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import {
  DndContext,
  DragEndEvent,
  DragMoveEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCenter,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { WikiTreeNode } from "../types";
import {
  applyWikiTreeMove,
  resolveWikiTreeDropZone,
  type WikiTreeDropPlacement,
} from "@/lib/wiki/apply-tree-move";
import { WikiSuperAdminDeleteButton } from "./wiki-super-admin-delete-button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

const MONO: React.CSSProperties = {
  fontFamily: "var(--font-dm-mono), monospace",
};

type FlatNode = WikiTreeNode & { depth: number };

type DropPreview = { overId: string; zone: WikiTreeDropPlacement };

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

function ZoneHighlight({
  nodeType,
  activeZone,
}: {
  nodeType: WikiTreeNode["type"];
  activeZone: WikiTreeDropPlacement;
}) {
  const accent = "color-mix(in srgb, var(--ds-accent) 14%, transparent)";
  if (nodeType === "section") {
    return (
      <>
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            height: "33.33%",
            background: activeZone === "before" ? accent : "transparent",
            pointerEvents: "none",
          }}
        />
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "33.33%",
            height: "33.34%",
            background: activeZone === "inside" ? accent : "transparent",
            pointerEvents: "none",
          }}
        />
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: "33.33%",
            background: activeZone === "after" ? accent : "transparent",
            pointerEvents: "none",
          }}
        />
      </>
    );
  }
  return (
    <>
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: "50%",
          background: activeZone === "before" ? accent : "transparent",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "50%",
          background: activeZone === "after" ? accent : "transparent",
          pointerEvents: "none",
        }}
      />
    </>
  );
}

function TreeRow({
  node,
  isSuperAdmin,
  locale,
  preview,
}: {
  node: FlatNode;
  isSuperAdmin: boolean;
  locale: string;
  preview: DropPreview | null;
}) {
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    transform,
    isDragging: dragActive,
  } = useDraggable({ id: node.id });

  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: node.id });

  function setNodeRef(el: HTMLDivElement | null) {
    setDragRef(el);
    setDropRef(el);
  }

  const showZone = Boolean(preview && preview.overId === node.id && !dragActive);

  const style: React.CSSProperties = {
    // Keep source row in place while DragOverlay follows the pointer
    transform: dragActive ? undefined : CSS.Transform.toString(transform),
    opacity: dragActive ? 0.35 : 1,
    display: "flex",
    alignItems: "center",
    gap: 8,
    paddingLeft: node.depth * 20 + 12,
    paddingRight: 12,
    minHeight: 32,
    position: "relative",
    background: isOver && !showZone ? "var(--ds-bg-raised)" : "var(--ds-bg-base)",
    outline: isOver && !showZone ? "1px dashed var(--ds-accent)" : undefined,
    borderBottom: "1px solid var(--ds-border-subtle)",
  };

  return (
    <div ref={setNodeRef} style={style}>
      {showZone ? <ZoneHighlight nodeType={node.type} activeZone={preview!.zone} /> : null}
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
          position: "relative",
          zIndex: 1,
        }}
      >
        <span style={{ ...MONO, fontSize: 10, color: "var(--ds-text-muted)", flexShrink: 0 }}>⠿</span>
        <span
          style={{
            ...MONO,
            fontSize: 12,
            color: "var(--ds-text-secondary)",
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {node.title}
        </span>
        <span style={{ ...MONO, fontSize: 9, color: "var(--ds-text-muted)", flexShrink: 0 }}>
          {node.type}
        </span>
      </div>
      {isSuperAdmin && (
        <div style={{ position: "relative", zIndex: 1 }}>
          <WikiSuperAdminDeleteButton
            pageId={node.id}
            title={node.title}
            hasChildren={node.has_children}
            locale={locale}
            redirectTo={`/${locale}/dashboard/wiki/admin`}
          />
        </div>
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
  const [dropPreview, setDropPreview] = useState<DropPreview | null>(null);

  const lastPointerRef = useRef({ x: 0, y: 0 });
  const pointerCleanupRef = useRef<(() => void) | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const flat = useMemo(() => flattenTree(nodes, null, 0), [nodes]);

  function attachPointerTracker() {
    const handler = (e: PointerEvent) => {
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("pointermove", handler, { passive: true });
    pointerCleanupRef.current = () => {
      window.removeEventListener("pointermove", handler);
      pointerCleanupRef.current = null;
    };
  }

  function detachPointerTracker() {
    pointerCleanupRef.current?.();
  }

  function handleDragStart({ active, activatorEvent }: DragStartEvent) {
    if (activatorEvent instanceof PointerEvent) {
      lastPointerRef.current = { x: activatorEvent.clientX, y: activatorEvent.clientY };
    }
    setActiveId(active.id as string);
    setDropPreview(null);
    attachPointerTracker();
  }

  function handleDragMove(event: DragMoveEvent) {
    if (!event.over?.rect) {
      setDropPreview(null);
      return;
    }
    const overId = event.over.id as string;
    if (overId === event.active.id) {
      setDropPreview(null);
      return;
    }
    const node = nodes.find((n) => n.id === overId);
    if (!node) {
      setDropPreview(null);
      return;
    }
    const pointerY = lastPointerRef.current.y;
    const zone = resolveWikiTreeDropZone(event.over.rect, pointerY, node.type);
    setDropPreview((prev) => {
      if (prev?.overId === overId && prev.zone === zone) return prev;
      return { overId, zone };
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    detachPointerTracker();
    setDropPreview(null);
    setActiveId(null);

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const node = nodes.find((n) => n.id === over.id);
    if (!node) return;

    const pointerY = lastPointerRef.current.y;
    const placement = over.rect
      ? resolveWikiTreeDropZone(over.rect, pointerY, node.type)
      : node.type === "section"
        ? "inside"
        : "after";

    setNodes((prev) => applyWikiTreeMove(prev, active.id as string, over.id as string, placement));
  }

  function handleDragCancel() {
    detachPointerTracker();
    setDropPreview(null);
    setActiveId(null);
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
      toast.success("Wiki tree saved");
      setTimeout(() => setSaveState("idle"), 2000);
    } catch {
      setSaveState("error");
      toast.error("Couldn’t save tree", { description: "Check your connection and try again." });
    }
  }, [nodes]);

  const activeNode = flat.find((n) => n.id === activeId);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <p style={{ ...MONO, fontSize: 11, color: "var(--ds-text-muted)", maxWidth: "78ch", lineHeight: 1.45 }}>
          <strong>Section</strong> rows: top third = place <strong>before</strong>, middle = <strong>inside</strong> folder,
          bottom = <strong>after</strong>. <strong>Guide / reference / resource</strong>: top half = <strong>before</strong>,
          bottom half = <strong>after</strong>. Save when done.
        </p>
        <button
          type="button"
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
            cursor: saveState === "saving" ? "wait" : "pointer",
            opacity: saveState === "saving" ? 0.85 : 1,
            flexShrink: 0,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {saveState === "saving" ? <Spinner className="size-3.5 shrink-0 text-[var(--ds-accent)]" aria-hidden /> : null}
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
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          {flat.map((node) => (
            <TreeRow
              key={node.id}
              node={node}
              isSuperAdmin={isSuperAdmin}
              locale={locale}
              preview={dropPreview}
            />
          ))}

          <DragOverlay dropAnimation={null}>
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
