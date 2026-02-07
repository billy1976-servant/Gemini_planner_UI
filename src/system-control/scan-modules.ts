/**
 * Scan selection layer: conceptual scan modules mapped to existing API options.
 * Does not run scans; only defines UI groups and maps to backend scanOptions.
 */

import type { ScanModuleDef } from "./types";

/** API option keys accepted by POST /api/system-scan (scanOptions). */
export type ScanOptionKey =
  | "scanEngines"
  | "scanRuntime"
  | "scanUIBlocks"
  | "scanRegistries"
  | "scanApps"
  | "scanPaths"
  | "scanJsonDefinitions"
  | "scanImports"
  | "scanUnusedFiles";

/** All scan module definitions. Each subOption.apiKeys maps to ScanOptionKey. */
export const SCAN_MODULES: ScanModuleDef[] = [
  {
    id: "structure",
    label: "Structure Scan",
    subOptions: [
      { id: "duplicate_registries", label: "Duplicate registries", apiKeys: ["scanRegistries"] },
      { id: "legacy_folders", label: "Legacy folders", apiKeys: ["scanPaths", "scanApps"] },
      { id: "path_drift", label: "Path drift", apiKeys: ["scanPaths"] },
      { id: "orphan_definitions", label: "Orphan definitions", apiKeys: ["scanJsonDefinitions", "scanUnusedFiles"] },
    ],
  },
  {
    id: "renderer_identity",
    label: "Renderer Identity Scan",
    subOptions: [
      { id: "remount_triggers", label: "Remount triggers", apiKeys: ["scanRuntime", "scanUIBlocks"] },
      { id: "key_instability", label: "Key instability", apiKeys: ["scanUIBlocks"] },
      { id: "object_recreation", label: "Object recreation", apiKeys: ["scanRuntime"] },
      { id: "adapter_merge_churn", label: "Adapter merge churn", apiKeys: ["scanRuntime", "scanEngines"] },
    ],
  },
  {
    id: "registry",
    label: "Registry Scan",
    subOptions: [
      { id: "duplicate_sources", label: "Duplicate registry sources", apiKeys: ["scanRegistries"] },
      { id: "registry_drift", label: "Registry drift", apiKeys: ["scanRegistries"] },
      { id: "source_of_truth_conflicts", label: "Multiple source-of-truth conflicts", apiKeys: ["scanRegistries", "scanPaths"] },
    ],
  },
  {
    id: "engine",
    label: "Engine Scan",
    subOptions: [
      { id: "duplicated_engines", label: "Duplicated engines", apiKeys: ["scanEngines"] },
      { id: "fragmented_folders", label: "Fragmented folders", apiKeys: ["scanEngines"] },
      { id: "redundant_loaders", label: "Redundant loaders", apiKeys: ["scanRuntime", "scanEngines"] },
    ],
  },
  {
    id: "ui_system",
    label: "UI System Scan",
    subOptions: [
      { id: "atom_definition_duplication", label: "Atom definition duplication", apiKeys: ["scanUIBlocks", "scanJsonDefinitions"] },
      { id: "compound_drift", label: "Compound drift", apiKeys: ["scanUIBlocks"] },
      { id: "palette_propagation", label: "Palette propagation issues", apiKeys: ["scanUIBlocks", "scanRegistries"] },
    ],
  },
];

const ALL_KEYS: ScanOptionKey[] = [
  "scanEngines",
  "scanRuntime",
  "scanUIBlocks",
  "scanRegistries",
  "scanApps",
  "scanPaths",
  "scanJsonDefinitions",
  "scanImports",
  "scanUnusedFiles",
];

/**
 * Build API scanOptions from selected sub-option ids.
 * selectedSubIds: set of subOption.id (e.g. "duplicate_registries", "path_drift").
 */
export function selectedSubOptionsToApiOptions(selectedSubIds: Set<string>): Record<ScanOptionKey, boolean> {
  const out = {} as Record<ScanOptionKey, boolean>;
  ALL_KEYS.forEach((k) => (out[k] = false));
  for (const mod of SCAN_MODULES) {
    for (const sub of mod.subOptions) {
      if (selectedSubIds.has(sub.id)) {
        for (const key of sub.apiKeys as ScanOptionKey[]) {
          out[key] = true;
        }
      }
    }
  }
  return out;
}

/**
 * Full system scan: all options true.
 */
export function fullScanApiOptions(): Record<ScanOptionKey, boolean> {
  const out = {} as Record<ScanOptionKey, boolean>;
  ALL_KEYS.forEach((k) => (out[k] = true));
  return out;
}

/**
 * All sub-option ids (for "select all").
 */
export function getAllSubOptionIds(): string[] {
  const ids: string[] = [];
  for (const mod of SCAN_MODULES) {
    for (const sub of mod.subOptions) {
      ids.push(sub.id);
    }
  }
  return ids;
}
