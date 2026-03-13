export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getCampaignsData } from "../get-campaigns-data";
import { normalizeCampaignsToSignals } from "@/logic/business/business-signal";
import { getBusinessById } from "@/logic/business/business-model";
import { getSignalsForBusiness } from "@/logic/business/csv-signals-store";
import { runAdsPipelineFromSignals } from "@/logic/business/pipelines/ads-pipeline";
import type { BusinessSignal } from "@/logic/business/business-signal";

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
    const businessId = request.nextUrl.searchParams.get("businessId")?.trim() ?? null;
    let signals: BusinessSignal[];
    let totalBudget = 0;

    if (businessId) {
      const business = getBusinessById(businessId);
      if (business?.dataSourceType === "csv") {
        signals = getSignalsForBusiness(businessId);
        if (signals.length === 0) {
          console.log("[diag] insights businessId=%s signalCount=0 noData=true", businessId);
          return noDataResponse();
        }
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
    console.log("[diag] insights businessId=%s signalCount=%s noData=false", businessId, signals.length);

    const { aggregation, insights } = runAdsPipelineFromSignals(signals, totalBudget);

    return NextResponse.json({
      noData: false,
      executiveSummary: insights.executiveSummary,
      highlights: insights.highlights,
      ranking: {
        topStates: insights.ranking.topStates,
        worstStates: insights.ranking.worstStates,
        topHours: insights.ranking.topHours,
        worstHours: insights.ranking.worstHours,
      },
      trends: insights.trend,
      capacity: insights.capacity,
      recommendations: insights.recommendations,
      growthOpportunities: insights.growthOpportunities,
      projectionConfidenceScore: insights.projectionConfidenceScore,
      saturation: insights.saturation,
      demand: insights.demand,
      efficiencyHistory: insights.efficiencyHistory,
      marketDepth: insights.marketDepth,
      bundleImpact: insights.bundleImpact,
      byCampaign: aggregation.byCampaign,
      byHour: aggregation.byHour,
      byState: aggregation.byState,
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
