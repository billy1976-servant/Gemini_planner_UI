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
 */
export function expandOrgans(nodes: unknown[], loadOrganVariant: LoadOrganVariant): unknown[] {
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
        cloned.children = expandOrgans(cloned.children as unknown[], loadOrganVariant);
      }
      out.push(cloned);
      continue;
    }
    const organId = (n.organId ?? "") as string;
    const variantId = (n.variant ?? "default") as string;
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
      merged.children = expandOrgans(merged.children as unknown[], loadOrganVariant);
    }
    out.push(merged);
  }
  return out;
}

/**
 * Expand all organ nodes in a skin document (nodes and regions).
 * Returns a new document; does not mutate input.
 */
export function expandOrgansInDocument(
  doc: SiteSkinDocument,
  loadOrganVariant: LoadOrganVariant
): SiteSkinDocument {
  const result = { ...doc };
  if (Array.isArray((doc as Record<string, unknown>).nodes)) {
    (result as Record<string, unknown>).nodes = expandOrgans(
      (doc as Record<string, unknown>).nodes as unknown[],
      loadOrganVariant
    );
  }
  if (Array.isArray((doc as Record<string, unknown>).regions)) {
    (result as Record<string, unknown>).regions = (
      (doc as Record<string, unknown>).regions as { id: string; role: string; nodes: unknown[] }[]
    ).map((r) => ({
      ...r,
      nodes: expandOrgans(r.nodes, loadOrganVariant),
    }));
  }
  return result;
}
