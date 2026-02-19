/**
 * Shared engine utilities: generic template normalizer.
 * Engines do not render UI; they normalize config and expose typed hooks.
 */

import type { StructureType } from "../types";

/**
 * Cast/validate merged template to a contract config type.
 * Runtime validation optional; cast is used initially.
 */
export function normalizeTemplate<T>(
  structureType: StructureType,
  template: Record<string, unknown>
): T {
  return template as unknown as T;
}
