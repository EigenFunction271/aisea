/** Rows must include every page in the subtree rooted at `rootId`. */

export function collectSubtreeRows(
  rootId: string,
  allRows: { id: string; parent_id: string | null }[]
): { id: string; parent_id: string | null }[] {
  const idSet = new Set<string>();
  function collect(id: string) {
    idSet.add(id);
    for (const r of allRows) {
      if (r.parent_id === id) collect(r.id);
    }
  }
  collect(rootId);
  return allRows.filter((r) => idSet.has(r.id));
}

/** Post-order: children before parent — safe delete order for wiki_pages self-FKs. */
export function postOrderDeleteIds(
  rootId: string,
  rows: { id: string; parent_id: string | null }[]
): string[] {
  const byParent = new Map<string | null, string[]>();
  for (const r of rows) {
    const p = r.parent_id;
    if (!byParent.has(p)) byParent.set(p, []);
    byParent.get(p)!.push(r.id);
  }
  const out: string[] = [];
  function walk(id: string) {
    for (const cid of byParent.get(id) ?? []) {
      walk(cid);
    }
    out.push(id);
  }
  walk(rootId);
  return out;
}
