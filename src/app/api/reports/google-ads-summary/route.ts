export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getCampaignsData } from "@/app/api/google-ads/get-campaigns-data";
import { normalizeCampaignsToSignals } from "@/logic/business/business-signal";
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
 * Reuse insights pipeline (including saturation, demand, efficiency, market depth, bundle); render HTML for print-to-PDF.
 * No duplicated math.
 */
export async function GET() {
  try {
    const { campaigns, hourlyPerformance } = await getCampaignsData();
    const signals = normalizeCampaignsToSignals(campaigns, hourlyPerformance);

    const aggregated = runAdsAggregation({ signals });
    const ranking = runAdsRanking({
      byState: aggregated.byState,
      byHour: aggregated.byHour,
      topN: 5,
    });
    const previous = {
      impressions: 0, clicks: 0, cost: 0, conversions: 0, revenue: 0, roas: 0, cpa: 0, conversionRate: 0,
    };
    const trend = runAdsTrend({ current: aggregated.totals, previous });
    const totalBudget = campaigns.reduce((s, c) => s + c.budget, 0);
    const impressionShareSummary = deriveImpressionShareSummary(signals);
    const capacity = runAdsCapacity({
      totals: aggregated.totals,
      currentBudget: totalBudget,
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
