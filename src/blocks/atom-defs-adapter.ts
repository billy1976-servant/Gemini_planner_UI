/**
 * Atom definitions adapter — read-through bridge for atom definition lookup.
 *
 * Primary source: src/blocks/atoms.manifest.json (via getBlockAtomDefs).
 * Fallback: src/components/9-atoms/definitions/{atomId}.json (only in Node; not in browser).
 *
 * Use getAtomDefinition(atomId) wherever atom definition content is needed.
 * Does not replace registry.tsx, json-renderer, or compound runtime.
 */

import { getBlockAtomDefs } from "./blocks-registry";

export type AtomDefinition = Record<string, unknown>;

/**
 * Load fallback definition from original JSON file (Node only).
 * In browser, returns undefined so the system continues to work without fallback.
 */
function loadFallbackAtomDef(atomId: string): AtomDefinition | undefined {
  if (typeof process === "undefined" || !process.versions?.node) return undefined;
  try {
    const path = require("path");
    const fs = require("fs");
    const root = process.cwd();
    const filePath = path.join(root, "src/components/9-atoms/definitions", `${atomId}.json`);
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as AtomDefinition;
  } catch {
    return undefined;
  }
}

/**
 * Returns the definition object for an atom by id.
 * Uses atoms.manifest.json first; if not found, falls back to
 * src/components/9-atoms/definitions/{atomId}.json (Node only).
 */
export function getAtomDefinition(atomId: string): AtomDefinition | undefined {
  const manifest = getBlockAtomDefs();
  const fromManifest = manifest[atomId as keyof typeof manifest];
  if (fromManifest !== undefined) {
    return fromManifest as AtomDefinition;
  }
  return loadFallbackAtomDef(atomId);
}
