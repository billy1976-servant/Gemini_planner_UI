"use client";

/**
 * Phase 2 — Auto-operating TSX Structure: single hook for all structure types.
 * TSX authors call useAutoStructure() and get typed config; no manual engine selection.
 * Reads useStructureConfig() and dispatches to the correct engine normalizer internally.
 */

import { useStructureConfig } from "./StructureConfigContext";
import { getEngine } from "./engines";
import type {
  StructureType,
  ResolvedAppStructure,
  ListStructureConfig,
  BoardStructureConfig,
  DashboardStructureConfig,
  EditorStructureConfig,
  TimelineStructureConfig,
  DetailStructureConfig,
  WizardStructureConfig,
  GalleryStructureConfig,
} from "./types";

/** Base shape shared by all auto-structure results. */
interface AutoStructureBase {
  template: Record<string, unknown>;
  schemaVersion: string;
  featureFlags?: Record<string, boolean | string>;
}

/** Discriminated union: config is typed by structureType. */
export type UseAutoStructureResult =
  | (AutoStructureBase & { structureType: "list"; config: ListStructureConfig })
  | (AutoStructureBase & { structureType: "board"; config: BoardStructureConfig })
  | (AutoStructureBase & { structureType: "dashboard"; config: DashboardStructureConfig })
  | (AutoStructureBase & { structureType: "editor"; config: EditorStructureConfig })
  | (AutoStructureBase & { structureType: "timeline"; config: TimelineStructureConfig })
  | (AutoStructureBase & { structureType: "detail"; config: DetailStructureConfig })
  | (AutoStructureBase & { structureType: "wizard"; config: WizardStructureConfig })
  | (AutoStructureBase & { structureType: "gallery"; config: GalleryStructureConfig });

function toAutoResult(resolved: ResolvedAppStructure): UseAutoStructureResult {
  const engine = getEngine(resolved.structureType);
  const config = engine.toConfig(resolved.template);
  const base: AutoStructureBase = {
    template: resolved.template,
    schemaVersion: resolved.schemaVersion,
    featureFlags: resolved.featureFlags,
  };
  return {
    ...base,
    structureType: resolved.structureType,
    config,
  } as UseAutoStructureResult;
}

/**
 * Returns resolved structure config with typed config for the current structure type.
 * Use inside any component under TSXScreenWithEnvelope. No need to call useListConfig(),
 * useTimelineConfig(), etc. — this hook picks the correct engine and returns normalized config.
 *
 * @example
 * const config = useAutoStructure();
 * if (config?.structureType === "timeline") {
 *   const { slotMinutes, dayStart, dayEnd } = config.config;
 *   // ...
 * }
 */
export function useAutoStructure(): UseAutoStructureResult | null {
  const resolved = useStructureConfig();
  if (!resolved) return null;
  return toAutoResult(resolved);
}
