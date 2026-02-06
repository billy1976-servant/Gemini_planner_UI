/**
 * Content-only screen rule: layout primitives (Grid, Row, Column, Stack) must NOT
 * appear as node types in JSON. This module collapses such nodes into their parent:
 * parent.children is flattened to the layout node's children. Layout is NOT written
 * to parent.params (layout comes from Layout Engine / Preset at runtime, not from JSON).
 * LAYOUT_NODE_TYPES: single source from @/layout/layout-node-types.
 */
import { LAYOUT_NODE_TYPES } from "@/layout/layout-node-types";

function isLayoutNode(node: unknown): node is { type: string; children?: unknown[] } {
  if (!node || typeof node !== "object") return false;
  const t = (node as { type?: string }).type;
  return typeof t === "string" && LAYOUT_NODE_TYPES.has(t);
}

/**
 * Returns true if the tree contains any node with type in Grid/Row/Column/Stack.
 */
export function hasLayoutNodeType(node: unknown): boolean {
  if (!node || typeof node !== "object") return false;
  const n = node as { type?: string; children?: unknown[] };
  if (typeof n.type === "string" && LAYOUT_NODE_TYPES.has(n.type)) return true;
  if (Array.isArray(n.children)) {
    for (const c of n.children) {
      if (hasLayoutNodeType(c)) return true;
    }
  }
  return false;
}

/**
 * Collapse layout nodes into parent: replace the layout node with its children.
 * Does NOT add moleculeLayout or layout to parent — layout is supplied at runtime by Layout Engine / Preset.
 * Returns a new tree; does not mutate input.
 */
export function collapseLayoutNodes(node: unknown): unknown {
  if (!node || typeof node !== "object") return node;
  const n = node as Record<string, unknown>;
  if (!Array.isArray(n.children) || n.children.length === 0) {
    return { ...n };
  }

  const next: Record<string, unknown> = { ...n };
  const newChildren: unknown[] = [];

  for (const child of n.children as unknown[]) {
    if (isLayoutNode(child)) {
      const grandChildren = Array.isArray(child.children) ? (child.children as unknown[]) : [];
      for (const gc of grandChildren) {
        newChildren.push(collapseLayoutNodes(gc));
      }
    } else {
      newChildren.push(collapseLayoutNodes(child));
    }
  }

  next.children = newChildren;
  return next;
}

export { LAYOUT_NODE_TYPES } from "@/layout/layout-node-types";
