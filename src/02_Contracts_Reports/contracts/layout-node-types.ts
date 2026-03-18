/**
 * Layout node types that must not appear as node types in JSON (content-only rule).
 * Single source for collapse-layout-nodes and any other layout logic.
 * These are collapsed into their parent at runtime; layout is supplied by Layout Engine / Preset.
 */
export const LAYOUT_NODE_TYPES_LIST = ["Grid", "Row", "Column", "Stack"] as const;
export const LAYOUT_NODE_TYPES = new Set<string>(LAYOUT_NODE_TYPES_LIST);
