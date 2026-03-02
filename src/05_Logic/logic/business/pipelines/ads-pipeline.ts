/**
 * Shared ads pipeline: single source of truth for the full engine chain.
 * Used by /api/google-ads/insights and /api/decision-console/evaluate.
 * Same engines, same order; no engine contract changes.
 */

import { runAdsAggregation } from "@/logic/business/engines/ads-aggregation.engine";
import { runAdsRanking } from "@/logic/business/engines/ads-ranking.engine";
import { runAdsTrend } from "@/logic/business/engines/ads-trend.engine";
import { runAdsCapacity } from "@/logic/business/engines/ads-capacity.engine";
import { runAdsInsights } from "@/logic/business/engines/ads-insights.engine";
import { runAdsSaturation } from "@/logic/business/engines/ads-saturation.engine";
import { runAdsDemand } from "@/logic/business/engines/ads-demand.engine";
import { runAdsEfficiencyHistory } from "@/logic/business/engines/ads-efficiency-history.engine";
import { runAdsMarketDepth } from "@/logic/business/engines/ads-market-depth.engine";
import { runAdsBundleImpact } from "@/logic/business/engines/ads-bundle-impact.engine";
import { getProjectionSnapshots } from "@/logic/business/projections/projection-store";
import type { BusinessSignal } from "@/logic/business/business-signal";
import type { ImpressionShareSummary } from "@/logic/business/engines/ads-demand.engine";
import type { AdsAggregationOutput } from "@/logic/business/engines/ads-aggregation.engine";
import type { AdsInsightsOutput } from "@/logic/business/engines/ads-insights.engine";
import type { AdsRankingOutput } from "@/logic/business/engines/ads-ranking.engine";
import type { AdsTrendOutput } from "@/logic/business/engines/ads-trend.engine";
import type { AdsCapacityOutput } from "@/logic/business/engines/ads-capacity.engine";
import type { AdsSaturationOutput } from "@/logic/business/engines/ads-saturation.engine";
import type { AdsDemandOutput } from "@/logic/business/engines/ads-demand.engine";
import type { AdsEfficiencyHistoryOutput } from "@/logic/business/engines/ads-efficiency-history.engine";
import type { AdsMarketDepthOutput } from "@/logic/business/engines/ads-market-depth.engine";
import type { AdsBundleImpactOutput } from "@/logic/business/engines/ads-bundle-impact.engine";

function deriveImpressionShareSummary(signals: BusinessSignal[]): ImpressionShareSummary | null {
  const withShare = signals.filter(
    (s) =>
      s.metrics.impressionShare != null ||
      s.metrics.lostImpressionShareBudget != null ||
      s.metrics.lostImpressionShareRank != null
  );
  if (withShare.length === 0) return null;
  let is = 0,
    lostBudget = 0,
    lostRank = 0,
    n = 0;
  for (const s of withShare) {
    if (s.metrics.impressionShare != null) {
      is += s.metrics.impressionShare;
      n++;
    }
    if (s.metrics.lostImpressionShareBudget != null) lostBudget += s.metrics.lostImpressionShareBudget;
    if (s.metrics.lostImpressionShareRank != null) lostRank += s.metrics.lostImpressionShareRank;
  }
  const count = withShare.length;
  return {
    impressionShare: n > 0 ? is / n : undefined,
    lostImpressionShareBudget: count > 0 ? lostBudget / count : undefined,
    lostImpressionShareRank: count > 0 ? lostRank / count : undefined,
  };
}

export interface RunAdsPipelineFromSignalsResult {
  aggregation: AdsAggregationOutput;
  ranking: AdsRankingOutput;
  trend: AdsTrendOutput;
  capacity: AdsCapacityOutput;
  saturation: AdsSaturationOutput | null;
  demand: AdsDemandOutput | null;
  efficiencyHistory: AdsEfficiencyHistoryOutput | null;
  marketDepth: AdsMarketDepthOutput | null;
  bundleImpact: AdsBundleImpactOutput | null;
  insights: AdsInsightsOutput & {
    ranking: AdsRankingOutput;
    trend: AdsTrendOutput;
    capacity: AdsCapacityOutput;
  };
}

/**
 * Runs the full ads engine chain (same as previously in runFullAdsPipeline):
 * aggregation → ranking, trend, capacity, saturation, demand, efficiencyHistory,
 * marketDepth, bundleImpact → insights.
 * Used by insights and decision-console routes only.
 */
export function runAdsPipelineFromSignals(
  signals: BusinessSignal[],
  totalBudget: number = 0
): RunAdsPipelineFromSignalsResult {
  const aggregated = runAdsAggregation({ signals });
  const effectiveBudget = totalBudget || aggregated.totals.cost || 0;
  const ranking = runAdsRanking({
    byState: aggregated.byState,
    byHour: aggregated.byHour,
    topN: 5,
  });
  const previous = {
    impressions: 0,
    clicks: 0,
    cost: 0,
    conversions: 0,
    revenue: 0,
    roas: 0,
    cpa: 0,
    conversionRate: 0,
  };
  const trend = runAdsTrend({
    current: aggregated.totals,
    previous,
  });
  const impressionShareSummary = deriveImpressionShareSummary(signals);
  const capacity = runAdsCapacity({
    totals: aggregated.totals,
    currentBudget: effectiveBudget,
    impressionShare: impressionShareSummary?.impressionShare,
  });

  const projectionHistory = getProjectionSnapshots();
  const historicalProjections = projectionHistory.map((p) => ({
    budget: p.projectedBudget,
    roas: p.projectedROAS,
  }));
  const saturation = runAdsSaturation({
    aggregated: { totals: aggregated.totals },
    capacity,
    historicalProjections,
  });

  const demand = runAdsDemand({
    totals: aggregated.totals,
    impressionShareSummary,
  });

  const efficiencyHistory = runAdsEfficiencyHistory({
    projectionHistory,
  });

  const marketDepth = runAdsMarketDepth({
    totals: aggregated.totals,
    impressionShare: impressionShareSummary?.impressionShare,
    periodDays: 30,
  });

  const currentAov =
    (aggregated.totals.conversions ?? 0) > 0 && (aggregated.totals.revenue ?? 0) >= 0
      ? (aggregated.totals.revenue ?? 0) / (aggregated.totals.conversions ?? 1)
      : 0;
  const bundleImpact = runAdsBundleImpact({
    totals: aggregated.totals,
    currentAov,
    config: { products: [] },
  });

  const projectionAccuracy = null;
  const insightsOutput = runAdsInsights({
    aggregated,
    ranking,
    trend,
    capacity,
    projectionAccuracy,
    saturation,
    demand,
    efficiencyHistory,
    marketDepth,
    bundleImpact,
  });

  const insights = {
    ...insightsOutput,
    ranking,
    trend,
    capacity,
  };

  return {
    aggregation: aggregated,
    ranking,
    trend,
    capacity,
    saturation,
    demand,
    efficiencyHistory,
    marketDepth,
    bundleImpact,
    insights,
  };
}
