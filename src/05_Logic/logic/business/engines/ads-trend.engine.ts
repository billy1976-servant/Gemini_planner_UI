/**
 * Ads Trend Engine — JSON only.
 * Simple period-over-period delta; no regression.
 * Output: periodOverPeriodDelta, trendDirection, numericSlope.
 */

import type { AggregatedMetrics } from "./ads-aggregation.engine";

export type TrendDirection = "up" | "down" | "flat";

export interface AdsTrendInput {
  /** Current period aggregated metrics */
  current: AggregatedMetrics;
  /** Previous period aggregated metrics (same shape) */
  previous: AggregatedMetrics;
  /** Optional slope threshold for "up"/"down" (default 0.05 = 5%) */
  slopeThreshold?: number;
}

export interface AdsTrendOutput {
  periodOverPeriodDelta: {
    cost: number;
    conversions: number;
    roas: number;
    cpa: number;
  };
  trendDirection: TrendDirection;
  numericSlope: number; // (current - previous) / previous for ROAS, or 0 if previous is 0
}

const DEFAULT_SLOPE_THRESHOLD = 0.05;

export function runAdsTrend(input: AdsTrendInput): AdsTrendOutput {
  const { current, previous, slopeThreshold = DEFAULT_SLOPE_THRESHOLD } = input;
  const delta = {
    cost: current.cost - previous.cost,
    conversions: current.conversions - previous.conversions,
    roas: previous.roas !== 0 ? current.roas - previous.roas : 0,
    cpa: previous.cpa !== 0 ? current.cpa - previous.cpa : 0,
  };
  const numericSlope = previous.roas !== 0 ? (current.roas - previous.roas) / previous.roas : 0;
  let trendDirection: TrendDirection = "flat";
  if (numericSlope >= slopeThreshold) trendDirection = "up";
  else if (numericSlope <= -slopeThreshold) trendDirection = "down";
  return {
    periodOverPeriodDelta: delta,
    trendDirection,
    numericSlope,
  };
}
