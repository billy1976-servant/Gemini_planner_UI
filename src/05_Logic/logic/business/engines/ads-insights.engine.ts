/**
 * Ads Insights Engine — JSON only.
 * Composes executiveSummary, highlights, recommendations, growthOpportunities, projectionConfidenceScore.
 * Optional: saturation, demand, efficiencyHistory, marketDepth, bundleImpact (orchestration only; no recompute).
 */

import type { AdsAggregationOutput, AggregatedMetrics } from "./ads-aggregation.engine";
import type { AdsRankingOutput } from "./ads-ranking.engine";
import type { AdsTrendOutput } from "./ads-trend.engine";
import type { AdsCapacityOutput } from "./ads-capacity.engine";
import type { ProjectionCompareOutput } from "./ads-projection-compare.engine";
import type { AdsSaturationOutput } from "./ads-saturation.engine";
import type { AdsDemandOutput } from "./ads-demand.engine";
import type { AdsEfficiencyHistoryOutput } from "./ads-efficiency-history.engine";
import type { AdsMarketDepthOutput } from "./ads-market-depth.engine";
import type { AdsBundleImpactOutput } from "./ads-bundle-impact.engine";

export type RecommendationLevel = "increase" | "reduce" | "pause" | "test";

export interface Recommendation {
  level: RecommendationLevel;
  target: string;
  reason: string;
  expectedImpact: number;
}

export interface Highlight {
  label: string;
  value: number;
  direction: "up" | "down" | "stable";
  severity: "strong" | "moderate" | "weak";
}

export interface AdsInsightsInput {
  aggregated: AdsAggregationOutput;
  ranking: AdsRankingOutput;
  trend: AdsTrendOutput;
  capacity: AdsCapacityOutput;
  projectionAccuracy?: ProjectionCompareOutput | null;
  saturation?: AdsSaturationOutput | null;
  demand?: AdsDemandOutput | null;
  efficiencyHistory?: AdsEfficiencyHistoryOutput | null;
  marketDepth?: AdsMarketDepthOutput | null;
  bundleImpact?: AdsBundleImpactOutput | null;
}

export interface ExecutiveSummary {
  totalSpend: number;
  totalRevenue: number;
  roas: number;
  cpa: number;
  topState: string;
  topHour: number | null;
  worstState: string;
  growthOpportunities: string[];
}

export interface AdsInsightsOutput {
  executiveSummary: ExecutiveSummary;
  highlights: Highlight[];
  recommendations: Recommendation[];
  growthOpportunities: string[];
  projectionConfidenceScore: number;
  saturation?: AdsSaturationOutput | null;
  demand?: AdsDemandOutput | null;
  efficiencyHistory?: AdsEfficiencyHistoryOutput | null;
  marketDepth?: AdsMarketDepthOutput | null;
  bundleImpact?: AdsBundleImpactOutput | null;
}

function buildHighlights(
  totals: AggregatedMetrics,
  trend: AdsTrendOutput
): Highlight[] {
  const highlights: Highlight[] = [];
  const dir = trend.trendDirection === "up" ? "up" : trend.trendDirection === "down" ? "down" : "stable";
  const severity: "strong" | "moderate" | "weak" =
    Math.abs(trend.numericSlope) >= 0.15 ? "strong" : Math.abs(trend.numericSlope) >= 0.05 ? "moderate" : "weak";

  highlights.push({ label: "ROAS", value: totals.roas, direction: dir, severity });
  highlights.push({ label: "CPA", value: totals.cpa, direction: trend.periodOverPeriodDelta.cpa <= 0 ? "down" : trend.periodOverPeriodDelta.cpa > 0 ? "up" : "stable", severity });
  highlights.push({ label: "Total cost", value: totals.cost, direction: dir, severity });
  highlights.push({ label: "Conversions", value: totals.conversions, direction: trend.periodOverPeriodDelta.conversions >= 0 ? "up" : "down", severity });
  return highlights;
}

function buildRecommendations(
  aggregated: AdsAggregationOutput,
  trend: AdsTrendOutput,
  capacity: AdsCapacityOutput,
  saturation?: AdsSaturationOutput | null,
  demand?: AdsDemandOutput | null,
  efficiencyHistory?: AdsEfficiencyHistoryOutput | null
): Recommendation[] {
  const recs: Recommendation[] = [];
  const { totals } = aggregated;

  if (saturation?.diminishingReturnsDetected) {
    recs.push({
      level: "reduce",
      target: "Budget",
      reason: "Diminishing returns detected; cap budget near recommended max.",
      expectedImpact: saturation.recommendedMaxBudget - (totals.cost || 0),
    });
  }
  if (demand?.budgetConstraintDetected && demand.scalingHeadroomPercent > 40 && !saturation?.diminishingReturnsDetected) {
    recs.push({
      level: "increase",
      target: "Budget",
      reason: "Budget constraint detected with scaling headroom; opportunity to capture more share.",
      expectedImpact: capacity.projectedSafeBudget - (totals.cost || 0),
    });
  }
  if (efficiencyHistory?.efficiencyTrend === "declining" && recs.length === 0) {
    recs.push({
      level: "test",
      target: "Efficiency",
      reason: "Efficiency trend declining; test creative or targeting before scaling.",
      expectedImpact: 0,
    });
  }

  if (trend.trendDirection === "up" && totals.roas >= 3 && !saturation?.diminishingReturnsDetected) {
    recs.push({
      level: "increase",
      target: "Budget",
      reason: "ROAS strong and trend up; capacity supports safe expansion.",
      expectedImpact: capacity.projectedSafeBudget - (totals.cost || 0),
    });
  }
  if (trend.trendDirection === "down" && totals.roas < 2) {
    recs.push({
      level: "reduce",
      target: "Budget",
      reason: "ROAS below target with downward trend.",
      expectedImpact: -(totals.cost || 0) * 0.1,
    });
  }
  if (totals.cost > 0 && totals.conversions === 0) {
    recs.push({
      level: "pause",
      target: "Underperforming segments",
      reason: "Spend with no conversions; consider pausing or testing.",
      expectedImpact: 0,
    });
  }
  if (capacity.marginalCPARisk > 0 && trend.numericSlope > 0.05 && !saturation?.diminishingReturnsDetected) {
    recs.push({
      level: "test",
      target: "Expansion",
      reason: "Marginal CPA risk present; test expansion in top regions/hours.",
      expectedImpact: capacity.expectedROASAtExpansion * (capacity.projectedSafeBudget - totals.cost) - totals.cost * 0.05,
    });
  }
  if (recs.length === 0) {
    recs.push({
      level: "test",
      target: "Maintain",
      reason: "No strong signal to increase or reduce; maintain and monitor.",
      expectedImpact: 0,
    });
  }
  return recs;
}

function buildGrowthOpportunities(
  ranking: AdsRankingOutput,
  aggregated: AdsAggregationOutput,
  demand?: AdsDemandOutput | null,
  marketDepth?: AdsMarketDepthOutput | null,
  bundleImpact?: AdsBundleImpactOutput | null
): string[] {
  const opportunities: string[] = [];
  if (ranking.topStates.length > 0) {
    opportunities.push(`Expand in top state(s): ${ranking.topStates.map((s) => s.region).join(", ")}`);
  }
  if (ranking.topHours.length > 0) {
    opportunities.push(`Shift budget toward top hours: ${ranking.topHours.map((h) => `${h.hour}:00`).join(", ")}`);
  }
  const stateCount = Object.keys(aggregated.byState).filter((k) => k !== "Unknown").length;
  if (stateCount === 0 || aggregated.byState["Unknown"]) {
    opportunities.push("Add geographic targeting data to unlock state-level opportunities.");
  }
  if (demand?.budgetConstraintDetected && demand.scalingHeadroomPercent > 40) {
    opportunities.push(`Budget constraint detected; ${demand.scalingHeadroomPercent.toFixed(0)}% scaling headroom.`);
  }
  if (marketDepth && marketDepth.scalingHeadroomPercent > 30) {
    opportunities.push(`Market depth headroom: ${marketDepth.scalingHeadroomPercent.toFixed(0)}% (capture ${marketDepth.currentMarketCapturePercent.toFixed(0)}%).`);
  }
  if (bundleImpact && bundleImpact.projectedRevenueLiftPercent > 0) {
    opportunities.push(`Bundle revenue lift potential: ${bundleImpact.projectedRevenueLiftPercent.toFixed(1)}% (adoption est. ${(bundleImpact.bundleAdoptionRateEstimate * 100).toFixed(0)}%).`);
  }
  return opportunities;
}

export function runAdsInsights(input: AdsInsightsInput): AdsInsightsOutput {
  const {
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
  } = input;
  const { totals } = aggregated;

  const growthOpportunitiesList = buildGrowthOpportunities(ranking, aggregated, demand, marketDepth, bundleImpact);
  const executiveSummary: ExecutiveSummary = {
    totalSpend: totals.cost,
    totalRevenue: totals.revenue,
    roas: totals.roas,
    cpa: totals.cpa,
    topState: ranking.topStates[0]?.region ?? "Unknown",
    topHour: ranking.topHours[0]?.hour ?? null,
    worstState: ranking.worstStates[0]?.region ?? "Unknown",
    growthOpportunities: growthOpportunitiesList,
  };

  const highlights = buildHighlights(totals, trend);
  const recommendations = buildRecommendations(aggregated, trend, capacity, saturation, demand, efficiencyHistory);
  const growthOpportunities = growthOpportunitiesList;

  let projectionConfidenceScore = projectionAccuracy?.accuracyScore ?? 1;
  if (efficiencyHistory != null) {
    projectionConfidenceScore = (projectionConfidenceScore + efficiencyHistory.stabilityScore) / 2;
  }
  if (marketDepth != null) {
    projectionConfidenceScore = (projectionConfidenceScore + marketDepth.demandConfidenceScore) / 2;
  }

  return {
    executiveSummary,
    highlights,
    recommendations,
    growthOpportunities,
    projectionConfidenceScore,
    saturation: saturation ?? undefined,
    demand: demand ?? undefined,
    efficiencyHistory: efficiencyHistory ?? undefined,
    marketDepth: marketDepth ?? undefined,
    bundleImpact: bundleImpact ?? undefined,
  };
}
