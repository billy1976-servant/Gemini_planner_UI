/**
 * Ads Projection Compare Engine — compare projection vs actual for self-correction.
 * Output: varianceROAS, varianceCPA, accuracyScore, adjustmentRecommendation.
 */

import type { ProjectionSnapshot } from "../projections/projection-snapshot";
import type { AggregatedMetrics } from "./ads-aggregation.engine";

export interface ProjectionCompareInput {
  projection: ProjectionSnapshot;
  actual: AggregatedMetrics;
}

export interface ProjectionCompareOutput {
  varianceROAS: number;
  varianceCPA: number;
  accuracyScore: number;
  adjustmentRecommendation: string;
}

/**
 * Compare a past projection to actual aggregated metrics.
 * accuracyScore: 1 = perfect; 0 = max error. Based on relative variance.
 */
export function runProjectionCompare(input: ProjectionCompareInput): ProjectionCompareOutput {
  const { projection, actual } = input;
  const varianceROAS = actual.roas !== 0 ? (actual.roas - projection.projectedROAS) / actual.roas : 0;
  const varianceCPA = projection.projectedCPA !== 0 ? (actual.cpa - projection.projectedCPA) / projection.projectedCPA : 0;

  // Accuracy: 1 - min(1, |variance|) for each; average
  const roasAccuracy = 1 - Math.min(1, Math.abs(varianceROAS));
  const cpaAccuracy = 1 - Math.min(1, Math.abs(varianceCPA));
  const accuracyScore = (roasAccuracy + cpaAccuracy) / 2;

  let adjustmentRecommendation: string;
  if (accuracyScore >= 0.9) {
    adjustmentRecommendation = "Keep current projection parameters.";
  } else if (varianceROAS > 0.1 && varianceCPA < -0.1) {
    adjustmentRecommendation = "Consider slightly more aggressive budget expansion; ROAS exceeded projection.";
  } else if (varianceROAS < -0.1) {
    adjustmentRecommendation = "Reduce expansion or tighten targeting; ROAS below projection.";
  } else if (varianceCPA > 0.1) {
    adjustmentRecommendation = "Review creative or audience; CPA higher than projected.";
  } else {
    adjustmentRecommendation = "Minor calibration suggested; re-run projection with recent data.";
  }

  return {
    varianceROAS,
    varianceCPA,
    accuracyScore,
    adjustmentRecommendation,
  };
}
