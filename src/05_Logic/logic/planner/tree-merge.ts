/**
 * OSB V5 — Tree merge: attach journey fragments under base tree nodes by id.
 * Single place for merge semantics; no new engine.
 */

import type { StructureTreeNode } from "@/logic/engines/structure/structure.types";
import { BASE_NODE_IDS } from "./base-planner-tree";

/**
 * Merge journey tree fragments into the current tree.
 * For each top-level fragment node, if its id matches a base node id, attach the fragment's children under that base node.
 * If fragment id is not a base id, attach the whole fragment as a child of the root (life) or under a specified parent.
 */
export function mergeTreeFragmentsUnderBase(
  currentTree: StructureTreeNode[],
  fragments: StructureTreeNode[]
): StructureTreeNode[] {
  if (!fragments.length) return currentTree;

  function cloneNode(n: StructureTreeNode): StructureTreeNode {
    return {
      ...n,
      children: n.children?.length ? n.children.map(cloneNode) : undefined,
    };
  }

  function findNodeById(tree: StructureTreeNode[], id: string): StructureTreeNode | null {
    for (const node of tree) {
      if (node.id === id) return node;
      if (node.children?.length) {
        const found = findNodeById(node.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  function replaceNode(tree: StructureTreeNode[], id: string, replace: (n: StructureTreeNode) => StructureTreeNode): StructureTreeNode[] {
    return tree.map((node) => {
      if (node.id === id) return replace(node);
      if (node.children?.length) {
        return { ...node, children: replaceNode(node.children, id, replace) };
      }
      return node;
    });
  }

  let result = currentTree.map(cloneNode);

  for (const fragment of fragments) {
    const fragClone = cloneNode(fragment);
    if (BASE_NODE_IDS.has(fragClone.id)) {
      // Attach this fragment's children under the existing base node with this id.
      result = replaceNode(result, fragClone.id, (base) => ({
        ...base,
        children: [
          ...(base.children || []),
          ...(fragClone.children || []).map((c) => ({ ...c, id: c.id || "j-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9) })),
        ],
      }));
    } else {
      // Fragment is a new subtree (e.g. "Vacation 2025"); attach under life.
      const life = findNodeById(result, "life");
      if (life) {
        result = replaceNode(result, "life", (n) => ({
          ...n,
          children: [...(n.children || []), fragClone],
        }));
      } else {
        result = [...result, fragClone];
      }
    }
  }

  return result;
}
