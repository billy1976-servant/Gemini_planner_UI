/**
 * Module Tree → Blueprint.txt generator.
 * Takes a master tree and emits valid blueprint grammar.
 * Does NOT modify the blueprint compiler; output is consumed by existing compiler.
 */

import type { TreeNode } from "./tree-types";
import type { OrganTreeNode } from "./tree-types";

const INDENT_STEP = 2;

function* walk(
  nodes: TreeNode[],
  parentRawId: string,
  depth: number
): Generator<{ node: TreeNode; rawId: string; depth: number }> {
  const prefix = parentRawId || "1";
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const rawId = parentRawId ? `${parentRawId}.${i + 1}` : `${prefix}.${i}`;
    yield { node, rawId, depth };
    if (node.children?.length) {
      yield* walk(node.children, rawId, depth + 1);
    }
  }
}

function slotStr(slots: string[] | undefined): string {
  if (!slots?.length) return "";
  return ` [${slots.join(", ")}]`;
}

function line(
  rawId: string,
  name: string,
  type: string,
  opts: { slots?: string[]; logicAction?: string }
): string {
  const slotPart = slotStr(opts.slots);
  const behavior =
    opts.logicAction != null ? ` (logic.action: ${opts.logicAction})` : "";
  return `${rawId} | ${name} | ${type}${slotPart}${behavior}`;
}

function organLine(
  rawId: string,
  name: string,
  organId: string,
  slots?: string[]
): string {
  const slotPart = slotStr(slots);
  return `${rawId} | ${name} | organ:${organId}${slotPart}`;
}

/**
 * Emit blueprint.txt lines for a tree. Preserves rawId structure and
 * state.bind + logic.action compatibility with the existing compiler.
 */
export function treeToBlueprint(sectionTree: TreeNode[]): string {
  const lines: string[] = [];

  for (const { node, rawId, depth } of walk(sectionTree, "", 0)) {
    const indent = " ".repeat(depth * INDENT_STEP);

    if (node.type === "organ" && "organId" in node) {
      const o = node as OrganTreeNode;
      lines.push(indent + organLine(rawId, node.name, o.organId, o.slots));
      if (o.variant && o.variant !== "default") {
        lines.push(indent + " ".repeat(INDENT_STEP) + `variant: ${o.variant}`);
      }
    } else {
      lines.push(
        indent +
          line(rawId, node.name, node.type, {
            slots: node.slots,
            logicAction: node.logicAction,
          })
      );
      if (node.stateBind) {
        lines.push(
          indent + " ".repeat(INDENT_STEP) + `[state.bind: ${node.stateBind}]`
        );
      }
      if (node.target && !node.logicAction) {
        lines.push(indent + " ".repeat(INDENT_STEP) + `-> ${node.target}`);
      }
      if (node.variant && node.type !== "organ" && node.variant !== "default") {
        lines.push(indent + " ".repeat(INDENT_STEP) + `variant: ${node.variant}`);
      }
    }
  }

  return lines.join("\n");
}

/** Filter tree to only include nodes whose name is in allowed set (and their full subtrees). Returns a forest (multiple roots) when only some sections are enabled. */
export function filterTreeBySections(
  sectionTree: TreeNode[],
  allowedNames: Set<string>
): TreeNode[] {
  if (allowedNames.size === 0) return sectionTree;

  function collect(nodes: TreeNode[]): TreeNode[] {
    const out: TreeNode[] = [];
    for (const node of nodes) {
      if (allowedNames.has(node.name)) {
        out.push({ ...node });
      } else if (node.children?.length) {
        out.push(...collect(node.children));
      }
    }
    return out;
  }

  return collect(sectionTree);
}
