/**
 * Compose offline (apps-offline) screen for JsonRenderer.
 * Applies role inference when nodes lack roles; skips inference when all already have roles.
 */

export type OfflineScreenNode = {
  id?: string;
  type: string;
  role?: string;
  children?: OfflineScreenNode[];
  [key: string]: unknown;
};

export type ComposeOfflineScreenArgs = {
  rootNode: OfflineScreenNode;
  experienceProfile?: unknown;
  layoutState?: unknown;
};

/**
 * Composes the offline screen for JsonRenderer.
 * Applies role inference via inferRolesFromOfflineTree when needed.
 */
export function composeOfflineScreen({
  rootNode,
}: ComposeOfflineScreenArgs): OfflineScreenNode {
  return inferRolesFromOfflineTree(rootNode);
}

/**
 * Infer roles for top-level children of the offline tree:
 * - First Section (or first child) => role: "header"
 * - Remaining top-level nodes => role: "content"
 * - Preserve existing role if already present.
 * Does not mutate; returns a new tree.
 */
export function inferRolesFromOfflineTree(
  rootNode: OfflineScreenNode
): OfflineScreenNode {
  const children = rootNode.children;
  if (!Array.isArray(children) || children.length === 0) {
    return { ...rootNode };
  }

  // If all top-level nodes already have roles, skip inference.
  const allHaveRoles = children.every(
    (c) => c.role != null && c.role !== ""
  );
  if (allHaveRoles) {
    return { ...rootNode };
  }

  const isSection = (n: OfflineScreenNode) =>
    n.type === "Section" || n.type === "section";

  const firstSectionIndex = children.findIndex(isSection);
  const headerIndex =
    firstSectionIndex >= 0 ? firstSectionIndex : 0;

  const newChildren = children.map((child, i) => {
    const existingRole = child.role;
    if (existingRole != null && existingRole !== "") {
      return child;
    }
    const role = i === headerIndex ? "header" : "content";
    return { ...child, role };
  });

  return { ...rootNode, children: newChildren };
}
