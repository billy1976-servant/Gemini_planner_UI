/**
 * Universal Control Hub: resolveAppStructure(screenPath, metadata?) → ResolvedAppStructure.
 */

import type { ResolvedAppStructure, ScreenMetadata, StructureType } from "../types";
import { SCHEMA_VERSION } from "../types";
import { resolveByConvention } from "./convention";
import { loadTemplate } from "./templateLoader";

/** Optional resolver config (e.g. from tsx-structure-resolver.json). When not set, only metadata and default are used. */
let resolverConfig: import("../types").ResolverConfig | null = null;

export function setResolverConfig(config: import("../types").ResolverConfig | null): void {
  resolverConfig = config;
}

export function getResolverConfig(): import("../types").ResolverConfig | null {
  return resolverConfig;
}

/**
 * Resolves app structure by convention:
 * (1) Co-located .structure.json (stub), (2) Path-pattern config, (3) Metadata, (4) Default list + default.
 * Then loads template from built-in map and deep-merges overrides.
 */
export function resolveAppStructure(
  screenPath: string,
  metadata?: ScreenMetadata
): ResolvedAppStructure {
  // eslint-disable-next-line no-console -- diagnostic: confirm resolver receives override
  console.log("RESOLVER INPUT", screenPath, metadata);
  const convention = resolveByConvention(screenPath, metadata, resolverConfig);
  const template = loadTemplate(
    convention.structureType as StructureType,
    convention.templateId,
    convention.overrides
  );

  return {
    structureType: convention.structureType as StructureType,
    template,
    schemaVersion: SCHEMA_VERSION,
    featureFlags: undefined,
  };
}
