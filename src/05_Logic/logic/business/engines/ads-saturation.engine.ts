/**
 * Ads Saturation Engine — JSON only.
 * Marginal ROAS slope, diminishing returns flag, recommended max budget, saturation score.
 * No UI; deterministic.
 */

import type { AggregatedMetrics } from "./ads-aggregation.engine";
import type { AdsCapacityOutput } from "./ads-capacity.engine";

export interface SaturationDataPoint {
  budget: number;
  roas: number;
}

export interface AdsSaturationInput {
  aggregated: { totals: AggregatedMetrics };
  capacity: AdsCapacityOutput;
  /** Historical (budget, roas) points for slope; optional. When missing, use current only. */
  historicalProjections?: SaturationDataPoint[];
  /** Slope below this => diminishing returns (default 0.02) */
  diminishingReturnsSlopeThreshold?: number;
}

export interface AdsSaturationOutput {
  marginalRoasSlope: number;
  diminishingReturnsDetected: boolean;
  recommendedMaxBudget: number;
  saturationScore: number;
}

const DEFAULT_SLOPE_THRESHOLD = 0.02;

/**
 * Compute marginal ROAS slope from (budget, roas) points.
 * slope = delta(roas) / delta(budget) when delta(budget) > 0; else 0.
 */
function computeMarginalSlope(points: SaturationDataPoint[]): number {
  if (points.length < 2) return 0;
  const sorted = [...points].sort((a, b) => a.budget - b.budget);
  let sumSlope = 0;
  let count = 0;
  for (let i = 1; i < sorted.length; i++) {
    const dBudget = sorted[i].budget - sorted[i - 1].budget;
    if (dBudget <= 0) continue;
    const dRoas = sorted[i].roas - sorted[i - 1].roas;
    sumSlope += dRoas / dBudget;
    count++;
  }
  return count > 0 ? sumSlope / count : 0;
}

/**
 * Saturation score: 0 = no saturation, 1 = fully saturated.
 * Based on slope and diminishing returns flag.
 */
function computeSaturationScore(
  slope: number,
  threshold: number,
  diminishingReturns: boolean
): number {
  if (!diminishingReturns) return Math.max(0, -slope / (threshold * 2));
  return Math.min(1, 0.5 + Math.abs(slope) / (Math.abs(threshold) * 10));
}

export function runAdsSaturation(input: AdsSaturationInput): AdsSaturationOutput {
  const {
    aggregated,
    capacity,
    historicalProjections = [],
    diminishingReturnsSlopeThreshold = DEFAULT_SLOPE_THRESHOLD,
  } = input;
  const { totals } = aggregated;
  const currentBudget = totals.cost || 0;
  const currentRoas = totals.roas ?? 0;

  const points: SaturationDataPoint[] = [...historicalProjections];
  if (currentBudget >= 0 && currentRoas >= 0) {
    points.push({ budget: currentBudget, roas: currentRoas });
  }
  const marginalRoasSlope = computeMarginalSlope(points);
  const diminishingReturnsDetected = marginalRoasSlope < diminishingReturnsSlopeThreshold && points.length >= 2;

  let recommendedMaxBudget = capacity.projectedSafeBudget;
  if (diminishingReturnsDetected && points.length >= 2) {
    const sorted = [...points].sort((a, b) => a.budget - b.budget);
    const lastEfficient = sorted.findIndex((p, i) => i > 0 && (p.roas - sorted[i - 1].roas) / (p.budget - sorted[i - 1].budget + 1e-9) < diminishingReturnsSlopeThreshold);
    if (lastEfficient > 0) {
      recommendedMaxBudget = sorted[lastEfficient - 1].budget * 1.05;
    } else {
      recommendedMaxBudget = currentBudget * 1.05;
    }
  }

  const saturationScore = computeSaturationScore(
    marginalRoasSlope,
    diminishingReturnsSlopeThreshold,
    diminishingReturnsDetected
  );

  return {
    marginalRoasSlope,
    diminishingReturnsDetected,
    recommendedMaxBudget,
    saturationScore,
  };
}
