/**
 * Organ expansion: replace type:"organ" nodes with compound subtrees from variant JSON.
 * Runs before applySkinBindings so slots inside organs are resolved in one pass.
 */

import type { SiteSkinDocument } from "@/lib/site-skin/siteSkin.types";

export type LoadOrganVariant = (organId: string, variantId: string) => unknown;

function deepMergeTarget(
  target: Record<string, unknown>,
  ...sources: (Record<string, unknown> | null | undefined)[]
): Record<string, unknown> {
  const out = { ...target };
  for (const src of sources) {
    if (!src || typeof src !== "object") continue;
    for (const key of Object.keys(src)) {
      const srcVal = src[key];
      if (
        srcVal != null &&
        typeof srcVal === "object" &&
        !Array.isArray(srcVal) &&
        out[key] != null &&
        typeof out[key] === "object" &&
        !Array.isArray(out[key])
      ) {
        out[key] = deepMergeTarget(
          out[key] as Record<string, unknown>,
          srcVal as Record<string, unknown>
        );
      } else {
        out[key] = srcVal;
      }
    }
  }
  return out;
}

function isOrganNode(node: unknown): node is { type: string; organId?: string; variant?: string; [k: string]: unknown } {
  if (!node || typeof node !== "object") return false;
  const t = (node as { type?: string }).type;
  return typeof t === "string" && t.toLowerCase().trim() === "organ";
}

/**
 * Assign stable instance keys to top-level nodes (id = node.id ?? `section-${index}`).
 * Returns new array; does not mutate input. Use before expand so variant/layout overrides are keyed by instance.
 */
export function assignSectionInstanceKeys(nodes: unknown[]): unknown[] {
  if (!Array.isArray(nodes)) return nodes;
  return nodes.map((node, i) => {
    if (!node || typeof node !== "object") return node;
    const n = node as Record<string, unknown>;
    const id = (n.id ?? `section-${i}`) as string;
    return { ...n, id };
  });
}

/**
 * Collect instance key -> variant ID from top-level nodes (for panel initial values).
 * Organ nodes use node.id as key; Section nodes are skipped for variant.
 */
export function collectOrganVariantsByInstanceKey(nodes: unknown[]): Record<string, string> {
  const out: Record<string, string> = {};
  if (!Array.isArray(nodes)) return out;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (!node || typeof node !== "object") continue;
    const n = node as Record<string, unknown>;
    const key = (n.id ?? `section-${i}`) as string;
    if (isOrganNode(n)) {
      out[key] = (n.variant ?? "default") as string;
    }
  }
  return out;
}

/**
 * Expand a single array of nodes: replace any node with type "organ" by its variant tree.
 * Overrides: instance key (node.id) -> variantId, or legacy organId -> variantId.
 * Preserves instance key on expanded root (merged.id = n.id).
 */
export function expandOrgans(
  nodes: unknown[],
  loadOrganVariant: LoadOrganVariant,
  overrides?: Record<string, string> | null
): unknown[] {
  const out: unknown[] = [];
  for (const node of nodes) {
    if (!node || typeof node !== "object") {
      out.push(node);
      continue;
    }
    const n = node as Record<string, unknown>;
    if (!isOrganNode(n)) {
      const cloned = { ...n };
      if (Array.isArray(cloned.children)) {
        cloned.children = expandOrgans(cloned.children as unknown[], loadOrganVariant, overrides);
      }
      out.push(cloned);
      continue;
    }
    const organId = (n.organId ?? "") as string;
    const instanceKey = (n.id ?? "") as string;
    const variantId = (overrides != null && instanceKey && overrides[instanceKey] != null
      ? overrides[instanceKey]
      : overrides != null && organId && overrides[organId] != null
      ? overrides[organId]
      : (n.variant ?? "default")) as string;
    const variantRoot = loadOrganVariant(organId, variantId);
    if (!variantRoot || typeof variantRoot !== "object") {
      out.push(node);
      continue;
    }
    const variant = variantRoot as Record<string, unknown>;
    const merged = deepMergeTarget(
      { ...variant },
      variant.layout != null ? { layout: variant.layout } : {},
      variant.params != null ? { params: variant.params } : {},
      variant.content != null ? { content: variant.content } : {},
      n.layout != null ? { layout: n.layout as Record<string, unknown> } : {},
      n.params != null ? { params: n.params as Record<string, unknown> } : {},
      n.content != null ? { content: n.content as Record<string, unknown> } : {}
    );
    merged.id = (n.id ?? merged.id) as string;
    // Expose internal layout id for organ layout resolver (SectionCompound uses it; does not touch section layout).
    const mergedParams = (merged.params ?? {}) as Record<string, unknown>;
    merged.params = { ...mergedParams, internalLayoutId: variantId };
    if (Array.isArray(merged.children)) {
      merged.children = expandOrgans(merged.children as unknown[], loadOrganVariant, overrides);
    }
    out.push(merged);
  }
  return out;
}

/**
 * Collect organ IDs from a tree of nodes (for UI: which organs are on this screen).
 */
export function collectOrganIds(nodes: unknown[]): string[] {
  const ids = new Set<string>();
  for (const node of nodes) {
    if (!node || typeof node !== "object") continue;
    const n = node as Record<string, unknown>;
    if (isOrganNode(n)) {
      const id = (n.organId ?? "") as string;
      if (id) ids.add(id);
    }
    if (Array.isArray(n.children)) {
      collectOrganIds(n.children as unknown[]).forEach((id) => ids.add(id));
    }
  }
  return Array.from(ids);
}

/**
 * Collect organ ID -> variant ID from tree (for panel to show current variant per organ).
 * First occurrence wins per organId.
 */
export function collectOrganVariantsFromTree(nodes: unknown[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const node of nodes) {
    if (!node || typeof node !== "object") continue;
    const n = node as Record<string, unknown>;
    if (isOrganNode(n)) {
      const id = (n.organId ?? "") as string;
      if (id && out[id] == null) out[id] = (n.variant ?? "default") as string;
    }
    if (Array.isArray(n.children)) {
      const childVariants = collectOrganVariantsFromTree(n.children as unknown[]);
      for (const [id, v] of Object.entries(childVariants)) {
        if (out[id] == null) out[id] = v;
      }
    }
  }
  return out;
}

/**
 * Expand all organ nodes in a skin document (nodes and regions).
 * Returns a new document; does not mutate input.
 * Optional overrides: organId -> variantId for runtime variant switching (e.g. right panel).
 */
export function expandOrgansInDocument(
  doc: SiteSkinDocument,
  loadOrganVariant: LoadOrganVariant,
  overrides?: Record<string, string> | null
): SiteSkinDocument {
  const result = { ...doc };
  if (Array.isArray((doc as Record<string, unknown>).nodes)) {
    (result as Record<string, unknown>).nodes = expandOrgans(
      (doc as Record<string, unknown>).nodes as unknown[],
      loadOrganVariant,
      overrides
    );
  }
  if (Array.isArray((doc as Record<string, unknown>).regions)) {
    (result as Record<string, unknown>).regions = (
      (doc as Record<string, unknown>).regions as { id: string; role: string; nodes: unknown[] }[]
    ).map((r) => ({
      ...r,
      nodes: expandOrgans(r.nodes, loadOrganVariant, overrides),
    }));
  }
  return result;
}
