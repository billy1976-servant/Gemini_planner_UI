export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getCampaignsData } from "../get-campaigns-data";
import { normalizeCampaignsToSignals } from "@/logic/business/business-signal";
import { getBusinessById } from "@/logic/business/business-model";
import { getSignalsForBusiness } from "@/logic/business/csv-signals-store";
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

function noDataResponse() {
  return NextResponse.json({
    noData: true,
    executiveSummary: {
      totalSpend: 0,
      totalRevenue: 0,
      roas: 0,
      cpa: 0,
      topState: "—",
      topHour: null,
      worstState: "—",
      growthOpportunities: [],
    },
    highlights: [],
    ranking: { topStates: [], worstStates: [], topHours: [], worstHours: [] },
    trends: { periodOverPeriodDelta: { cost: 0, conversions: 0, roas: 0, cpa: 0 }, trendDirection: "flat", numericSlope: 0 },
    capacity: { projectedSafeBudget: 0, projectedAggressiveBudget: 0, expectedROASAtExpansion: 0, marginalCPARisk: 0 },
    recommendations: [],
    growthOpportunities: [],
    projectionConfidenceScore: 0,
    saturation: null,
    demand: null,
    efficiencyHistory: null,
    marketDepth: null,
    bundleImpact: null,
    byCampaign: {},
    byHour: {},
    byState: {},
  });
}

/**
 * GET /api/google-ads/insights?businessId=optional
 * If businessId present and business is CSV: use signals from in-memory CSV store; if none, return noData.
 * Otherwise: getCampaignsData → normalize → same pipeline.
 * Single pipeline; no duplicated aggregation.
 */
export async function GET(request: NextRequest) {
  try {
    console.log("INSIGHTS ROUTE HIT");
    const businessId = request.nextUrl.searchParams.get("businessId")?.trim() ?? null;
    console.log("INSIGHTS USING BUSINESS:", businessId);
    let signals: BusinessSignal[];
    let totalBudget = 0;

    if (businessId) {
      const business = getBusinessById(businessId);
      if (business?.dataSourceType === "csv") {
        signals = getSignalsForBusiness(businessId);
        console.log("INSIGHTS SIGNALS RETURNED:", signals?.length ?? 0);
        console.log("STORE SIZE DURING READ:", signals?.length);
        if (signals.length === 0) return noDataResponse();
        totalBudget = 0;
      } else {
        const { campaigns, hourlyPerformance } = await getCampaignsData();
        signals = normalizeCampaignsToSignals(campaigns, hourlyPerformance);
        totalBudget = campaigns.reduce((s, c) => s + c.budget, 0);
      }
    } else {
      const { campaigns, hourlyPerformance } = await getCampaignsData();
      signals = normalizeCampaignsToSignals(campaigns, hourlyPerformance);
      totalBudget = campaigns.reduce((s, c) => s + c.budget, 0);
    }
    console.log("Loaded signals count:", signals.length);

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
    const insights = runAdsInsights({
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

    return NextResponse.json({
      noData: false,
      executiveSummary: insights.executiveSummary,
      highlights: insights.highlights,
      ranking: {
        topStates: ranking.topStates,
        worstStates: ranking.worstStates,
        topHours: ranking.topHours,
        worstHours: ranking.worstHours,
      },
      trends: trend,
      capacity,
      recommendations: insights.recommendations,
      growthOpportunities: insights.growthOpportunities,
      projectionConfidenceScore: insights.projectionConfidenceScore,
      saturation: insights.saturation,
      demand: insights.demand,
      efficiencyHistory: insights.efficiencyHistory,
      marketDepth: insights.marketDepth,
      bundleImpact: insights.bundleImpact,
      byCampaign: aggregated.byCampaign,
      byHour: aggregated.byHour,
      byState: aggregated.byState,
    });
  } catch (error: any) {
    if (error.message?.includes("GOOGLE_ADS_MODE")) {
      return NextResponse.json(
        { error: error.message, message: error.message },
        { status: 400 }
      );
    }
    console.error("[Google Ads insights] Error:", error);
    return NextResponse.json(
      { error: "Failed to compute insights", message: error.message },
      { status: 500 }
    );
  }
}
