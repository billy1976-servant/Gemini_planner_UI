/**
 * Ads Market Depth Engine — JSON only.
 * Estimated monthly demand, market capture %, scaling headroom, demand confidence.
 * Deterministic; tolerates missing search volume / impression share.
 */

import type { AggregatedMetrics } from "./ads-aggregation.engine";

export interface MarketDepthInput {
  totals: AggregatedMetrics;
  /** Optional search volume (e.g. monthly); when missing, estimate from clicks/impressions */
  searchVolumeMonthly?: number;
  /** 0–1 impression share when available */
  impressionShare?: number;
  /** Days of data this aggregate represents (default 30) */
  periodDays?: number;
}

export interface AdsMarketDepthOutput {
  estimatedMonthlyDemand: number;
  currentMarketCapturePercent: number;
  scalingHeadroomPercent: number;
  demandConfidenceScore: number;
}

const DEFAULT_PERIOD_DAYS = 30;

export function runAdsMarketDepth(input: MarketDepthInput): AdsMarketDepthOutput {
  const {
    totals,
    searchVolumeMonthly,
    impressionShare,
    periodDays = DEFAULT_PERIOD_DAYS,
  } = input;

  const impressions = totals.impressions ?? 0;
  const clicks = totals.clicks ?? 0;
  const cost = totals.cost ?? 0;

  let estimatedMonthlyDemand = searchVolumeMonthly ?? 0;
  if (estimatedMonthlyDemand <= 0 && impressions > 0) {
    const scale = periodDays <= 0 ? 1 : 30 / periodDays;
    estimatedMonthlyDemand = impressions * scale;
  }

  let currentMarketCapturePercent = 0;
  if (impressionShare != null && impressionShare > 0) {
    currentMarketCapturePercent = Math.min(100, impressionShare * 100);
  } else if (estimatedMonthlyDemand > 0 && impressions > 0) {
    currentMarketCapturePercent = Math.min(100, (impressions / (estimatedMonthlyDemand / 30 * periodDays)) * 100);
  }

  let scalingHeadroomPercent = 50;
  if (currentMarketCapturePercent < 100) {
    scalingHeadroomPercent = Math.min(90, 100 - currentMarketCapturePercent + 10);
  }

  let demandConfidenceScore = 0.5;
  if (searchVolumeMonthly != null && searchVolumeMonthly > 0) demandConfidenceScore = 0.85;
  else if (impressions > 0 && clicks > 0) demandConfidenceScore = 0.6;
  if (impressionShare != null) demandConfidenceScore = Math.min(1, demandConfidenceScore + 0.1);

  return {
    estimatedMonthlyDemand,
    currentMarketCapturePercent,
    scalingHeadroomPercent,
    demandConfidenceScore,
  };
}
