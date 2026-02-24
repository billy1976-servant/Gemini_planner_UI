/**
 * Ads Demand Engine — JSON only.
 * Budget/rank constraint detection and scaling headroom from impression share.
 * Tolerates missing data.
 */

import type { AggregatedMetrics } from "./ads-aggregation.engine";

export interface ImpressionShareSummary {
  /** 0–1 average impression share when available */
  impressionShare?: number;
  /** 0–1 lost share due to budget */
  lostImpressionShareBudget?: number;
  /** 0–1 lost share due to rank */
  lostImpressionShareRank?: number;
}

export interface AdsDemandInput {
  totals: AggregatedMetrics;
  /** Optional; when missing all flags false, headroom 0.5 */
  impressionShareSummary?: ImpressionShareSummary | null;
  /** High ROAS above this => scaling opportunity when lost budget share is high */
  highRoasThreshold?: number;
}

export interface AdsDemandOutput {
  budgetConstraintDetected: boolean;
  rankConstraintDetected: boolean;
  scalingHeadroomPercent: number;
}

const HIGH_ROAS_THRESHOLD = 3;

export function runAdsDemand(input: AdsDemandInput): AdsDemandOutput {
  const {
    totals,
    impressionShareSummary,
    highRoasThreshold = HIGH_ROAS_THRESHOLD,
  } = input;

  if (impressionShareSummary == null) {
    return {
      budgetConstraintDetected: false,
      rankConstraintDetected: false,
      scalingHeadroomPercent: 50,
    };
  }

  const lostBudget = impressionShareSummary.lostImpressionShareBudget ?? 0;
  const lostRank = impressionShareSummary.lostImpressionShareRank ?? 0;
  const share = impressionShareSummary.impressionShare ?? 0;
  const roas = totals.roas ?? 0;
  const cost = totals.cost ?? 0;

  const budgetConstraintDetected = lostBudget > 0.1;
  const rankConstraintDetected = lostRank > 0.1;

  let scalingHeadroomPercent = 50;
  if (roas >= highRoasThreshold && lostBudget > 0.2) {
    scalingHeadroomPercent = Math.min(90, 50 + lostBudget * 80);
  } else if (lostBudget < 0.05 && cost > 0) {
    scalingHeadroomPercent = Math.max(0, 30 - (1 - share) * 20);
  } else if (budgetConstraintDetected) {
    scalingHeadroomPercent = 40 + lostBudget * 30;
  }

  return {
    budgetConstraintDetected,
    rankConstraintDetected,
    scalingHeadroomPercent,
  };
}
