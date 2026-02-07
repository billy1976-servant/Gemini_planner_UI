/**
 * Blocks Registry — read-only bridge for the consolidated blocks foundation.
 *
 * This module is additive only. It reads the consolidated atom manifest (and can
 * later include compounds) to expose a single source of truth for block definitions.
 * It does NOT replace or modify the existing engine registry, json-renderer, or
 * any runtime imports. Use this bridge for tooling, validation, and future
 * consolidation; the renderer continues to use engine/core/registry and
 * compounds/ui as today.
 */

import atomsManifest from "./atoms.manifest.json";

export type AtomsManifest = typeof atomsManifest;
export type AtomDefs = AtomsManifest["atoms"];

/**
 * Returns the full atoms object from the consolidated manifest.
 */
export function getBlockAtomDefs(): AtomDefs {
  return atomsManifest.atoms;
}

/**
 * Returns the list of atom ids (keys) in the manifest.
 */
export function listBlockAtomIds(): string[] {
  return Object.keys(atomsManifest.atoms);
}
