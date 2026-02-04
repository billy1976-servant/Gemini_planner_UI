/**
 * Section helpers for page layout: collect section keys/nodes and labels from tree.
 * Used by page.tsx for OrganPanel rows (section layout overrides).
 */

import { getOrganLabel } from "@/organs/organ-registry";

/**
 * Collect every section instance from top-level nodes (no dedupe).
 * Section key = node.id. One row per section so multiple galleries get multiple rows.
 */
export function collectSectionKeysAndNodes(nodes: any[]): {
  sectionKeys: string[];
  sectionByKey: Record<string, any>;
} {
  const sectionKeys: string[] = [];
  const sectionByKey: Record<string, any> = {};
  if (!Array.isArray(nodes)) return { sectionKeys, sectionByKey };
  for (const node of nodes) {
    const type = (node?.type ?? "").toString().toLowerCase();
    if (type !== "section") continue;
    const key = (node.id ?? node.role) ?? "";
    if (!key) continue;
    sectionKeys.push(key);
    sectionByKey[key] = node;
  }
  return { sectionKeys, sectionByKey };
}

/**
 * Human-readable labels per section instance (e.g. "Gallery 1", "Gallery 2", "Hero").
 */
export function collectSectionLabels(
  sectionKeys: string[],
  sectionByKey: Record<string, any>
): Record<string, string> {
  const labels: Record<string, string> = {};
  const roleCount: Record<string, number> = {};
  const roleToOrganId: Record<string, string> = {
    features: "features-grid",
    content: "content-section",
  };
  for (const key of sectionKeys) {
    const node = sectionByKey[key];
    const role = (node?.role ?? "section").toString().trim() || "section";
    const count = (roleCount[role] ?? 0) + 1;
    roleCount[role] = count;
    const organId = roleToOrganId[role] ?? role;
    const baseLabel = getOrganLabel(organId);
    const label = count === 1 ? baseLabel : `${baseLabel} ${count}`;
    labels[key] = label;
  }
  return labels;
}
