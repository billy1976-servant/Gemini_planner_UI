/**
 * Module Tree System — Shared types for master trees.
 * Trees are the editable source-of-truth; blueprint.txt is generated FROM trees.
 * DO NOT embed these in the blueprint compiler.
 */

export type TreeNodeKind =
  | "Section"
  | "Stepper"
  | "Card"
  | "Field"
  | "Button"
  | "Footer"
  | "organ";

/** State bind for two-way field binding (e.g. journal.think). */
export interface StateBind {
  type: "bind";
  key: string;
}

/** Logic action (e.g. state:journal.add or navigation). */
export interface LogicAction {
  type: "action";
  expr: string;
}

/** Navigation target (rawId or name). */
export interface NavTarget {
  target: string;
}

export interface TreeNodeBase {
  /** Display/component name (e.g. ThinkSection, SaveButton). */
  name: string;
  /** Node kind; use "organ" with organId for organs. */
  type: TreeNodeKind | string;
  /** Content slot keys for content.txt (e.g. ["title"], ["label"], ["body", "media"]). */
  slots?: string[];
  /** state.bind key for Field nodes. */
  stateBind?: string;
  /** logic.action expression (e.g. "state:journal.add"). */
  logicAction?: string;
  /** Navigation target (rawId or name) for buttons/links. */
  target?: string;
  /** Organ variant when type === "organ". */
  variant?: string;
}

export interface TreeNode extends TreeNodeBase {
  children?: TreeNode[];
}

/** Organ node: type is "organ", organId required. */
export interface OrganTreeNode extends TreeNodeBase {
  type: "organ";
  organId: string;
  slots?: string[];
  variant?: string;
  children?: TreeNode[];
}

export function isOrganNode(n: TreeNode): n is OrganTreeNode {
  return n.type === "organ" && "organId" in n;
}

/** Section tree root: list of top-level nodes (no single root node in blueprint). */
export type SectionTree = TreeNode[];
