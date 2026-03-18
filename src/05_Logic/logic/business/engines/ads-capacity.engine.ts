/**
 * Ads Capacity Engine — JSON only.
 * projectedSafeBudget, projectedAggressiveBudget, expectedROASAtExpansion, marginalCPARisk.
 * Degrades gracefully when impression share / stability data missing.
 */

import type { AggregatedMetrics } from "./ads-aggregation.engine";

export interface AdsCapacityInput {
  totals: AggregatedMetrics;
  currentBudget?: number;
  /** 0–1 when available; missing => assume moderate headroom */
  impressionShare?: number;
  /** Optional stability (e.g. variance); missing => no penalty */
  performanceStabilityFactor?: number;
  /** Max safe expansion multiplier (e.g. 1.2 = 20% lift) */
  maxSafeLift?: number;
  /** Aggressive expansion multiplier (e.g. 1.5) */
  aggressiveLift?: number;
}

export interface AdsCapacityOutput {
  projectedSafeBudget: number;
  projectedAggressiveBudget: number;
  expectedROASAtExpansion: number;
  marginalCPARisk: number;
}

const DEFAULT_MAX_SAFE_LIFT = 1.2;
const DEFAULT_AGGRESSIVE_LIFT = 1.5;

export function runAdsCapacity(input: AdsCapacityInput): AdsCapacityOutput {
  const {
    totals,
    currentBudget,
    impressionShare,
    performanceStabilityFactor = 1,
    maxSafeLift = DEFAULT_MAX_SAFE_LIFT,
    aggressiveLift = DEFAULT_AGGRESSIVE_LIFT,
  } = input;

  const budget = currentBudget ?? (totals.cost || 0);
  const roas = totals.roas ?? 0;
  const cpa = totals.cpa ?? 0;

  // Headroom: when impression share is high, limit expansion
  const headroom = impressionShare != null ? Math.max(0, 1 - impressionShare) : 0.5;
  const safeLift = Math.min(maxSafeLift, 1 + headroom * (maxSafeLift - 1));
  const aggLift = Math.min(aggressiveLift, 1 + headroom * (aggressiveLift - 1));

  const projectedSafeBudget = budget * safeLift * performanceStabilityFactor;
  const projectedAggressiveBudget = budget * aggLift * performanceStabilityFactor;

  // Expected ROAS at expansion: assume slight dilution when scaling (degrade gracefully)
  const dilution = 0.95; // 5% dilution at expansion when no data
  const expectedROASAtExpansion = roas * dilution;

  // Marginal CPA risk: increase in CPA per unit budget increase (simplified)
  const marginalCPARisk = cpa > 0 ? cpa * 0.1 : 0;

  return {
    projectedSafeBudget,
    projectedAggressiveBudget,
    expectedROASAtExpansion,
    marginalCPARisk,
  };
}
