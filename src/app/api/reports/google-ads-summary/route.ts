export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getCampaignsData } from "@/app/api/google-ads/get-campaigns-data";
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
import { generateGoogleAdsReportHtml } from "./report-html";

function deriveImpressionShareSummary(signals: BusinessSignal[]): ImpressionShareSummary | null {
  const withShare = signals.filter(
    (s) =>
      s.metrics.impressionShare != null ||
      s.metrics.lostImpressionShareBudget != null ||
      s.metrics.lostImpressionShareRank != null
  );
  if (withShare.length === 0) return null;
  let is = 0, lostBudget = 0, lostRank = 0, n = 0;
  for (const s of withShare) {
    if (s.metrics.impressionShare != null) { is += s.metrics.impressionShare; n++; }
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

/**
 * GET /api/reports/google-ads-summary
 * Optional ?businessId= — when present and business is CSV, use CSV signals; else use Google Ads data.
 * Reuse insights pipeline (including saturation, demand, efficiency, market depth, bundle); render HTML for print-to-PDF.
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
          const emptyHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Report</title></head><body><p>No CSV data. Upload data in the Data tab first, or use &quot;Test with sample CSV&quot; for CSV Upload.</p><p><a href="/">Back to workspace</a></p></body></html>`;
          return new NextResponse(emptyHtml, {
            headers: { "Content-Type": "text/html; charset=utf-8" },
          });
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
    console.log("Loaded signals count:", signals.length);

    const aggregated = runAdsAggregation({ signals });
    const effectiveBudget = totalBudget || aggregated.totals.cost || 0;
    const ranking = runAdsRanking({
      byState: aggregated.byState,
      byHour: aggregated.byHour,
      topN: 5,
    });
    const previous = {
      impressions: 0, clicks: 0, cost: 0, conversions: 0, revenue: 0, roas: 0, cpa: 0, conversionRate: 0,
    };
    const trend = runAdsTrend({ current: aggregated.totals, previous });
    const impressionShareSummary = deriveImpressionShareSummary(signals);
    const capacity = runAdsCapacity({
      totals: aggregated.totals,
      currentBudget: effectiveBudget,
      impressionShare: impressionShareSummary?.impressionShare,
    });
    const projectionHistory = getProjectionSnapshots();
    const historicalProjections = projectionHistory.map((p) => ({ budget: p.projectedBudget, roas: p.projectedROAS }));
    const saturation = runAdsSaturation({
      aggregated: { totals: aggregated.totals },
      capacity,
      historicalProjections,
    });
    const demand = runAdsDemand({ totals: aggregated.totals, impressionShareSummary });
    const efficiencyHistory = runAdsEfficiencyHistory({ projectionHistory });
    const marketDepth = runAdsMarketDepth({
      totals: aggregated.totals,
      impressionShare: impressionShareSummary?.impressionShare,
      periodDays: 30,
    });
    const currentAov =
      (aggregated.totals.conversions ?? 0) > 0 && (aggregated.totals.revenue ?? 0) >= 0
        ? (aggregated.totals.revenue ?? 0) / (aggregated.totals.conversions ?? 1)
        : 0;
    const bundleImpact = runAdsBundleImpact({ totals: aggregated.totals, currentAov, config: { products: [] } });
    const insights = runAdsInsights({
      aggregated,
      ranking,
      trend,
      capacity,
      projectionAccuracy: null,
      saturation,
      demand,
      efficiencyHistory,
      marketDepth,
      bundleImpact,
    });

    const payload = {
      insights,
      ranking,
      trends: trend,
      capacity,
      aggregated,
      generatedAt: new Date().toISOString(),
    };
    const html = generateGoogleAdsReportHtml(payload);

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": "inline; filename=google-ads-summary.html",
      },
    });
  } catch (error: any) {
    if (error.message?.includes("GOOGLE_ADS_MODE")) {
      return NextResponse.json(
        { error: error.message, message: error.message },
        { status: 400 }
      );
    }
    console.error("[google-ads-summary] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate report", message: error.message },
      { status: 500 }
    );
  }
}
