/**
 * Compound definitions adapter — read-only bridge for the blocks compound manifest.
 *
 * Loads src/blocks/compounds.manifest.json and exposes compound ids, manifest
 * object, and runtime paths. Runtime still uses original TSX under
 * src/compounds/ui/12-molecules; this adapter is for tooling and future consolidation.
 */

import compoundsManifest from "./compounds.manifest.json";

export type CompoundsManifest = typeof compoundsManifest;
export type CompoundEntry = {
  id: string;
  type: string;
  runtimePath: string;
  notes?: string;
};
export type CompoundsMap = CompoundsManifest["compounds"];

/**
 * Returns the full compounds object from the manifest.
 */
export function getCompoundManifest(): CompoundsMap {
  return compoundsManifest.compounds;
}

/**
 * Returns the list of compound ids (keys) in the manifest.
 */
export function getCompoundIds(): string[] {
  return Object.keys(compoundsManifest.compounds);
}

/**
 * Returns the runtimePath for a compound id, or undefined if not in manifest.
 */
export function getCompoundRuntimePath(id: string): string | undefined {
  const entry = compoundsManifest.compounds[id as keyof CompoundsMap];
  return entry?.runtimePath;
}
