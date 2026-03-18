/**
 * Health interpretation layer. Derives scores and overall status from scan data only.
 * Does not modify any files.
 */

import type { SystemScanResult } from "./types";
import type { HealthStatus } from "./types";

export type HealthScores = {
  structureHealth: number;   // 0–100
  duplicationRisk: number;   // 0–100 (higher = worse)
  registryDriftRisk: number;
  legacyRisk: number;
  runtimeSafety: number;     // 0–100 (higher = better)
};

export type HealthBanner = {
  status: HealthStatus;
  label: string;
  explanation: string;
  color: string;
};

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/**
 * Compute health scores from scan totals and details.
 */
export function computeHealthScores(result: SystemScanResult): HealthScores {
  const t = result.totals;
  const dupCount = t.duplicatesCount;
  const warnCount = t.warningsCount;
  const legacyCount = t.legacyPathsDetected;
  const regDup = result.registries.duplicated.length;
  const hasStructure = t.foldersScanned >= 5 && t.tsxFiles > 0;

  const structureHealth = hasStructure
    ? clamp(100 - (warnCount * 3) - (legacyCount > 0 ? 10 : 0), 0, 100)
    : 50;

  const duplicationRisk = dupCount === 0 ? 0 : clamp(20 + dupCount * 15 + regDup * 10, 0, 100);
  const registryDriftRisk = regDup === 0 && t.registries <= 5 ? 0 : clamp(regDup * 20 + (t.registries > 8 ? 20 : 0), 0, 100);
  const legacyRisk = legacyCount === 0 ? 0 : clamp(15 + legacyCount * 5, 0, 100);
  const runtimeSafety = clamp(100 - (warnCount * 5) - (legacyCount * 2) - (dupCount * 3), 0, 100);

  return {
    structureHealth,
    duplicationRisk,
    registryDriftRisk,
    legacyRisk,
    runtimeSafety,
  };
}

/**
 * Derive overall health banner from scores.
 */
export function getHealthBanner(scores: HealthScores, result: SystemScanResult): HealthBanner {
  const t = result.totals;
  const { duplicationRisk, registryDriftRisk, legacyRisk, runtimeSafety, structureHealth } = scores;

  const problems = (t.duplicatesCount > 0 ? 1 : 0) + (t.warningsCount > 2 ? 1 : 0) + (t.legacyPathsDetected > 0 ? 1 : 0);
  const critical = duplicationRisk >= 50 || registryDriftRisk >= 50 || runtimeSafety < 60;

  if (critical || problems >= 3) {
    return {
      status: "needs_attention",
      label: "Needs Attention",
      explanation: "High duplication or registry drift, or low runtime safety. Review recommended refactor order before any changes.",
      color: "#ef4444",
    };
  }

  if (duplicationRisk > 0 || registryDriftRisk > 0 || legacyRisk > 0 || problems >= 1) {
    return {
      status: "minor_drift",
      label: "Minor Drift",
      explanation: "Some duplicates, legacy paths, or registry drift detected. Safe to plan small refactors from the list below.",
      color: "#f59e0b",
    };
  }

  return {
    status: "stable",
    label: "Stable",
    explanation: "Structure looks healthy. No major duplication or legacy path issues.",
    color: "#22c55e",
  };
}
