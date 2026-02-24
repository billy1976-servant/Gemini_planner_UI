/**
 * Ads Efficiency History Engine — JSON only.
 * Efficiency trend, average marginal return, stability score from projection history.
 * Uses existing projection store shape; no DB refactor.
 */

import type { ProjectionSnapshotWithMeta } from "../projections/projection-snapshot";

export interface AdsEfficiencyHistoryInput {
  /** Projection snapshot history (e.g. from getProjectionSnapshots()) */
  projectionHistory: ProjectionSnapshotWithMeta[];
  /** Min points to compute trend (default 2) */
  minPointsForTrend?: number;
}

export type EfficiencyTrend = "improving" | "stable" | "declining";

export interface AdsEfficiencyHistoryOutput {
  efficiencyTrend: EfficiencyTrend;
  averageMarginalReturn: number;
  stabilityScore: number;
}

function computeAverageMarginalReturn(history: ProjectionSnapshotWithMeta[]): number {
  if (history.length < 2) return 0;
  const sorted = [...history].sort((a, b) => a.createdAt - b.createdAt);
  let sum = 0;
  let count = 0;
  for (let i = 1; i < sorted.length; i++) {
    const dBudget = sorted[i].projectedBudget - sorted[i - 1].projectedBudget;
    if (dBudget <= 0) continue;
    const dRoas = sorted[i].projectedROAS - sorted[i - 1].projectedROAS;
    sum += dRoas / dBudget;
    count++;
  }
  return count > 0 ? sum / count : 0;
}

function computeStabilityScore(history: ProjectionSnapshotWithMeta[]): number {
  if (history.length < 2) return 1;
  const roasValues = history.map((h) => h.projectedROAS);
  const mean = roasValues.reduce((a, b) => a + b, 0) / roasValues.length;
  const variance = roasValues.reduce((s, v) => s + (v - mean) ** 2, 0) / roasValues.length;
  const std = Math.sqrt(variance);
  if (mean === 0) return 1;
  const cv = std / mean;
  return Math.max(0, 1 - cv);
}

export function runAdsEfficiencyHistory(input: AdsEfficiencyHistoryInput): AdsEfficiencyHistoryOutput {
  const { projectionHistory, minPointsForTrend = 2 } = input;
  const history = projectionHistory.filter((h) => h.projectedBudget >= 0 && h.projectedROAS >= 0);

  const averageMarginalReturn = computeAverageMarginalReturn(history);
  const stabilityScore = computeStabilityScore(history);

  let efficiencyTrend: EfficiencyTrend = "stable";
  if (history.length >= minPointsForTrend) {
    if (averageMarginalReturn > 0.01) efficiencyTrend = "improving";
    else if (averageMarginalReturn < -0.01) efficiencyTrend = "declining";
  }

  return {
    efficiencyTrend,
    averageMarginalReturn,
    stabilityScore,
  };
}
