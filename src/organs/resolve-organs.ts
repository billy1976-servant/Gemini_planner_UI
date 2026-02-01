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
 * Expand a single array of nodes: replace any node with type "organ" by its variant tree.
 * Recurses into children so nested structures and expanded subtrees are also expanded.
 * Optional overrides: organId -> variantId (e.g. from right-panel controls).
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
    const variantId =
      (overrides != null && organId && overrides[organId] != null
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
