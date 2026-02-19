/**
 * Convention-based resolution. No per-screen registry.
 * Resolution order (all four sources; first match wins):
 * 1. Co-located: CO_LOCATED_MAP[screenPath] (stub; build can populate for *.structure.json).
 * 2. Path-pattern config: resolverConfig.patterns[].glob match → structureType + templateId; overrides from metadata merged.
 * 3. Screen metadata: metadata.structure.{ type, templateId, overrides } (e.g. from apps-json).
 * 4. Default: resolverConfig.default or { list, default, {} }.
 */

import type { StructureType } from "../types";
import type { ScreenMetadata } from "../types";
import type { ResolverConfig } from "../types";

export interface ConventionResult {
  structureType: StructureType;
  templateId: string;
  overrides: Record<string, unknown>;
}

/** Co-located map: screenPath → ConventionResult. Build-time populated or empty. Stub: no dynamic file read. */
const CO_LOCATED_MAP: Record<string, ConventionResult> = {};

/**
 * Match screenPath against a glob pattern (minimal glob: * matches any segment).
 * Supports globs with double-star and segment pattern (e.g. any path ending in JSX_PlannerShell*).
 */
function matchGlob(screenPath: string, glob: string): boolean {
  const normalizedPath = screenPath.replace(/\\/g, "/");
  const parts = normalizedPath.split("/");
  const globParts = glob.split("/").filter(Boolean);
  let pathIdx = 0;
  let globIdx = 0;
  while (globIdx < globParts.length && pathIdx < parts.length) {
    const g = globParts[globIdx];
    if (g === "**") {
      globIdx++;
      if (globIdx >= globParts.length) return true;
      const next = globParts[globIdx];
      while (pathIdx < parts.length) {
        if (matchSegment(parts[pathIdx], next)) {
          pathIdx++;
          globIdx++;
          break;
        }
        pathIdx++;
      }
      continue;
    }
    if (!matchSegment(parts[pathIdx], g)) return false;
    pathIdx++;
    globIdx++;
  }
  if (globIdx < globParts.length) return false;
  return pathIdx <= parts.length;
}

function matchSegment(segment: string, pattern: string): boolean {
  if (pattern.startsWith("*") && pattern.endsWith("*")) {
    const inner = pattern.slice(1, -1);
    return segment.includes(inner);
  }
  if (pattern.endsWith("*")) {
    const prefix = pattern.slice(0, -1);
    return segment.startsWith(prefix);
  }
  if (pattern.startsWith("*")) {
    const suffix = pattern.slice(1);
    return segment.endsWith(suffix);
  }
  return segment === pattern || pattern === "*";
}

const DEFAULT_RESOLUTION: ConventionResult = {
  structureType: "list",
  templateId: "default",
  overrides: {},
};

/**
 * Resolve structure type + template id + overrides by convention.
 * Order: (1) Co-located, (2) Path-pattern config, (3) Metadata, (4) Default.
 */
export function resolveByConvention(
  screenPath: string,
  metadata?: ScreenMetadata,
  resolverConfig?: ResolverConfig | null
): ConventionResult {
  const coLocated = CO_LOCATED_MAP[screenPath];
  if (coLocated) return coLocated;

  if (resolverConfig?.patterns?.length) {
    for (const p of resolverConfig.patterns) {
      if (matchGlob(screenPath, p.glob)) {
        return {
          structureType: p.structureType,
          templateId: p.templateId,
          overrides: metadata?.structure?.overrides ?? {},
        };
      }
    }
  }

  if (metadata?.structure) {
    return {
      structureType: metadata.structure.type ?? DEFAULT_RESOLUTION.structureType,
      templateId: metadata.structure.templateId ?? DEFAULT_RESOLUTION.templateId,
      overrides: metadata.structure.overrides ?? {},
    };
  }

  if (resolverConfig?.default) {
    return {
      structureType: resolverConfig.default.structureType,
      templateId: resolverConfig.default.templateId,
      overrides: {},
    };
  }

  return DEFAULT_RESOLUTION;
}
