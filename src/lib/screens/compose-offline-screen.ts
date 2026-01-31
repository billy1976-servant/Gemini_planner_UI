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
 * - First Section => role: "header"
 * - Second Section (if exists) => role: "hero"
 * - Remaining Sections => role: "content"
 * - Preserve existing role if already present.
 * 
 * Phase 5: Expanded to support Wix-grade section roles.
 * Roles: header, hero, content, features, gallery, testimonials, pricing, faq, cta, footer
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

  const isSection = (n: OfflineScreenNode) => {
    const type = typeof n.type === "string" ? n.type.toLowerCase() : "";
    return type === "section";
  };

  // Find section indices
  const sectionIndices = children
    .map((child, i) => (isSection(child) ? i : -1))
    .filter((i) => i >= 0);

  const newChildren = children.map((child, i) => {
    const existingRole = child.role;
    if (existingRole != null && existingRole !== "") {
      return child;
    }

    // Only assign roles to sections
    if (!isSection(child)) {
      return child;
    }

    // Determine role based on position among sections
    const sectionPosition = sectionIndices.indexOf(i);
    let role = "content"; // default

    if (sectionPosition === 0) {
      role = "header";
    } else if (sectionPosition === 1) {
      role = "hero";
    } else if (sectionPosition === sectionIndices.length - 1) {
      role = "footer";
    } else {
      role = "content";
    }

    return { ...child, role };
  });

  return { ...rootNode, children: newChildren };
}
