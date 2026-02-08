/**
 * Organ variant validator: walk variant JSON and assert every node `type`
 * is in the Registry (or "slot"). No custom types or business logic allowed.
 *
 * Run via: npm run test:organs:layer7 or ts-node -r tsconfig-paths/register src/organs/validate-variants.ts
 */

import { loadOrganVariant } from "./organ-registry";

// Allowed node types: Registry keys (JsonRenderer) + "slot" (resolved by applySkinBindings).
// Lowercase for case-insensitive check.
const ALLOWED_TYPES = new Set(
  [
    "screen", "section", "row", "column", "grid", "stack", "page",
    "button", "card", "avatar", "chip", "field", "footer", "list", "modal",
    "stepper", "toast", "toolbar", "navigation", "pricingtable", "faq",
    "ctabanner", "imagegallery", "icontextrow",
    "text", "media", "surface", "sequence", "trigger", "collection",
    "condition", "shell", "fieldatom", "textarea",
    "slot",
  ].map((t) => t.toLowerCase())
);

function collectTypes(node: unknown, types: Set<string>): void {
  if (!node || typeof node !== "object") return;
  const n = node as { type?: string; children?: unknown[] };
  if (typeof n.type === "string") types.add(n.type.trim().toLowerCase());
  if (Array.isArray(n.children)) n.children.forEach((c) => collectTypes(c, types));
}

export type ValidationResult = { ok: true } | { ok: false; organId: string; variantId: string; invalidTypes: string[] };

/**
 * Validate one variant tree: every node type must be in ALLOWED_TYPES.
 */
export function validateVariantTree(organId: string, variantId: string, root: unknown): ValidationResult {
  const types = new Set<string>();
  collectTypes(root, types);
  const invalid = [...types].filter((t) => !ALLOWED_TYPES.has(t));
  if (invalid.length > 0) return { ok: false, organId, variantId, invalidTypes: invalid };
  return { ok: true };
}

/**
 * Validate all organ variants (loaded via loadOrganVariant).
 * Requires manifest list: pass array of { id, variantIds }.
 */
export function validateAllVariants(
  manifests: { id: string; variantIds: string[] }[]
): ValidationResult[] {
  const results: ValidationResult[] = [];
  for (const manifest of manifests) {
    for (const variantId of manifest.variantIds) {
      const root = loadOrganVariant(manifest.id, variantId);
      if (root == null) {
        results.push({ ok: false, organId: manifest.id, variantId, invalidTypes: ["<variant not loaded>"] });
        continue;
      }
      results.push(validateVariantTree(manifest.id, variantId, root));
    }
  }
  return results;
}
