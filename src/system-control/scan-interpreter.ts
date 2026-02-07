/**
 * Interprets scan result into scan-category status and safety zones.
 * Read-only; no file system access.
 */

import type { SystemScanResult } from "./types";
import type { ScanCategory, ScanCategoryStatus, SafetyZoneItem } from "./types";

const SCAN_CATEGORY_IDS = ["structure", "registry_drift", "duplication", "legacy", "engine_density"] as const;

/**
 * Map current scan result to conceptual scan categories and status.
 * Underlying scan is unchanged; this is visual grouping.
 */
export function getScanCategories(result: SystemScanResult | null): ScanCategory[] {
  if (!result) {
    return SCAN_CATEGORY_IDS.map((id) => ({
      id,
      label: categoryLabel(id),
      status: "not_run" as ScanCategoryStatus,
    }));
  }

  const t = result.totals;
  const dupCount = result.registries.duplicated.length || t.duplicatesCount;
  const legacyCount = t.legacyPathsDetected;
  const warnCount = t.warningsCount;
  const engineCount = t.enginesDetected;

  return [
    {
      id: "structure",
      label: "Structure Scan",
      status: t.foldersScanned > 0 ? (warnCount > 2 ? "attention" : "completed") : "not_run",
      summary: `${t.foldersScanned} folders, ${t.tsxFiles} TSX, ${t.jsonFiles} JSON`,
    },
    {
      id: "registry_drift",
      label: "Registry Drift Scan",
      status: result.registries.total > 0 ? (result.registries.duplicated.length > 0 ? "attention" : "completed") : "not_run",
      summary: `${result.registries.total} registries, ${result.registries.duplicated.length} duplicates`,
    },
    {
      id: "duplication",
      label: "Duplication Scan",
      status: dupCount > 0 ? "attention" : "completed",
      summary: dupCount > 0 ? `${dupCount} duplicate(s)` : "None",
    },
    {
      id: "legacy",
      label: "Legacy Scan",
      status: legacyCount > 0 ? "attention" : "completed",
      summary: legacyCount > 0 ? `${legacyCount} legacy path(s)` : "None",
    },
    {
      id: "engine_density",
      label: "Engine Density Scan",
      status: engineCount > 0 ? (engineCount > 25 ? "attention" : "completed") : "not_run",
      summary: `${engineCount} engine modules`,
    },
  ];
}

function categoryLabel(id: string): string {
  const map: Record<string, string> = {
    structure: "Structure Scan",
    registry_drift: "Registry Drift Scan",
    duplication: "Duplication Scan",
    legacy: "Legacy Scan",
    engine_density: "Engine Density Scan",
  };
  return map[id] || id;
}

/**
 * Safety zones: classification only. Do not touch = core runtime, compiler, state engines.
 */
export function getSafetyZones(result: SystemScanResult | null): SafetyZoneItem[] {
  const safe: string[] = [];
  const caution: string[] = [];
  const doNot: string[] = ["core runtime", "compiler", "state engines"];

  if (result) {
    if (result.registries.duplicated.length > 0) {
      safe.push("duplicate registries");
    }
    if (result.totals.legacyPathsDetected > 0) {
      safe.push("legacy folders");
    }
    if (result.pathHealth.length > 0) {
      safe.push("drift paths");
    }
    if (result.totals.enginesDetected > 0) {
      caution.push("engine folders");
    }
    if (result.runtime.length > 0) {
      caution.push("runtime bindings");
    }
  }

  return [
    { zone: "safe", label: "SAFE TO TOUCH", items: safe.length ? safe : ["(none identified)"] },
    { zone: "caution", label: "USE CAUTION", items: caution.length ? caution : ["(none identified)"] },
    { zone: "do_not_touch", label: "DO NOT TOUCH", items: doNot },
  ];
}
