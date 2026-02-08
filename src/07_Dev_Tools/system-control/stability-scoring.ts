/**
 * Stability scoring: registry health, identity stability, adapter integrity,
 * engine fragmentation, legacy debt. Overall score, drift severity, refactor urgency.
 * Read-only interpretation of scan data.
 */

import type { SystemScanResult } from "./types";
import type { StabilityScores, DriftSeverity, RefactorUrgency } from "./types";

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/**
 * Compute per-category stability scores (0–100; higher = healthier).
 */
export function computeStabilityScores(result: SystemScanResult): StabilityScores {
  const t = result.totals;
  const regDup = result.registries.duplicated.length;
  const legacyCount = t.legacyPathsDetected;
  const engineCount = t.enginesDetected;
  const warnCount = t.warningsCount;

  const registryHealth = regDup === 0 && t.registries <= 6
    ? 100
    : clamp(100 - regDup * 15 - (t.registries > 8 ? 20 : 0), 0, 100);

  const identityStability = clamp(100 - warnCount * 8 - (result.runtime.length > 4 ? 10 : 0), 0, 100);

  const adapterIntegrity = result.runtime.length === 0
    ? 100
    : clamp(100 - result.runtime.reduce((s, r) => s + r.fileCount, 0) * 2 - (result.pathHealth?.length ?? 0) * 5, 0, 100);

  const engineFragmentationRaw = engineCount > 25 ? 30 : engineCount > 15 ? 60 : 100;
  const engineFragmentation = engineFragmentationRaw;

  const legacyDebtRaw = legacyCount === 0 ? 100 : clamp(100 - legacyCount * 10, 0, 100);
  const legacyDebt = legacyDebtRaw;

  return {
    registryHealth,
    identityStability,
    adapterIntegrity,
    engineFragmentation,
    legacyDebt,
  };
}

/**
 * Overall health score 0–100 (average of categories, equal weight).
 */
export function overallHealthScore(scores: StabilityScores): number {
  const sum =
    scores.registryHealth +
    scores.identityStability +
    scores.adapterIntegrity +
    scores.engineFragmentation +
    scores.legacyDebt;
  return Math.round(sum / 5);
}

/**
 * Drift severity from scores.
 */
export function getDriftSeverity(scores: StabilityScores): DriftSeverity {
  const overall = overallHealthScore(scores);
  if (overall >= 80) return "low";
  if (overall >= 55) return "medium";
  return "high";
}

/**
 * Refactor urgency from scores and drift.
 */
export function getRefactorUrgency(scores: StabilityScores, drift: DriftSeverity): RefactorUrgency {
  if (drift === "high" || scores.registryHealth < 50 || scores.legacyDebt < 50) return "high";
  if (drift === "medium" || scores.registryHealth < 70) return "medium";
  return "low";
}
