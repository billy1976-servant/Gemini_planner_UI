/**
 * Google Ads Summary Report — HTML for print-to-PDF.
 * No business math; receives pre-computed insights payload.
 */

import type { AdsInsightsOutput } from "@/logic/business/engines/ads-insights.engine";
import type { AdsRankingOutput } from "@/logic/business/engines/ads-ranking.engine";
import type { AdsCapacityOutput } from "@/logic/business/engines/ads-capacity.engine";
import type { AdsTrendOutput } from "@/logic/business/engines/ads-trend.engine";
import type { AdsAggregationOutput } from "@/logic/business/engines/ads-aggregation.engine";

export interface GoogleAdsReportPayload {
  insights: AdsInsightsOutput;
  ranking: AdsRankingOutput;
  trends: AdsTrendOutput;
  capacity: AdsCapacityOutput;
  aggregated: AdsAggregationOutput;
  generatedAt: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function generateGoogleAdsReportHtml(payload: GoogleAdsReportPayload): string {
  const { insights, ranking, capacity, aggregated, generatedAt } = payload;
  const es = insights.executiveSummary;

  const page = (title: string, content: string) =>
    `<div class="page"><h2>${escapeHtml(title)}</h2>${content}</div>`;

  const page1 = page(
    "Executive Summary",
    `
    <div class="summary-grid">
      <div class="summary-item"><span class="label">Total Spend</span><span class="value">$${es.totalSpend.toFixed(2)}</span></div>
      <div class="summary-item"><span class="label">Total Revenue</span><span class="value">$${es.totalRevenue.toFixed(2)}</span></div>
      <div class="summary-item"><span class="label">ROAS</span><span class="value">${es.roas.toFixed(2)}</span></div>
      <div class="summary-item"><span class="label">CPA</span><span class="value">$${es.cpa.toFixed(2)}</span></div>
      <div class="summary-item"><span class="label">Top State</span><span class="value">${escapeHtml(es.topState)}</span></div>
      <div class="summary-item"><span class="label">Top Hour</span><span class="value">${es.topHour != null ? `${es.topHour}:00` : "—"}</span></div>
      <div class="summary-item"><span class="label">Worst State</span><span class="value">${escapeHtml(es.worstState)}</span></div>
    </div>
    <p class="meta">Generated: ${escapeHtml(generatedAt)}</p>
  `
  );

  const stateRows = Object.entries(aggregated.byState)
    .map(([region, m]) => `<tr><td>${escapeHtml(region)}</td><td>${m.cost.toFixed(2)}</td><td>${m.conversions}</td><td>${m.roas.toFixed(2)}</td><td>${m.cpa.toFixed(2)}</td></tr>`)
    .join("");
  const page2 = page(
    "State Allocation",
    `
    <table class="data-table">
      <thead><tr><th>Region</th><th>Cost</th><th>Conversions</th><th>ROAS</th><th>CPA</th></tr></thead>
      <tbody>${stateRows || "<tr><td colspan=\"5\">No state data</td></tr>"}</tbody>
    </table>
  `
  );

  const hourRows = Object.entries(aggregated.byHour)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([h, m]) => `<tr><td>${h}:00</td><td>${m.cost.toFixed(2)}</td><td>${m.conversions}</td><td>${m.roas.toFixed(2)}</td></tr>`)
    .join("");
  const page3 = page(
    "Time-of-Day Performance",
    `
    <table class="data-table">
      <thead><tr><th>Hour</th><th>Cost</th><th>Conversions</th><th>ROAS</th></tr></thead>
      <tbody>${hourRows || "<tr><td colspan=\"4\">No hourly data</td></tr>"}</tbody>
    </table>
  `
  );

  const page4 = page(
    "Growth Capacity & Recommendations",
    `
    <div class="summary-grid">
      <div class="summary-item"><span class="label">Projected Safe Budget</span><span class="value">$${capacity.projectedSafeBudget.toFixed(2)}</span></div>
      <div class="summary-item"><span class="label">Projected Aggressive Budget</span><span class="value">$${capacity.projectedAggressiveBudget.toFixed(2)}</span></div>
      <div class="summary-item"><span class="label">Expected ROAS at Expansion</span><span class="value">${capacity.expectedROASAtExpansion.toFixed(2)}</span></div>
      <div class="summary-item"><span class="label">Marginal CPA Risk</span><span class="value">${capacity.marginalCPARisk.toFixed(2)}</span></div>
    </div>
    <h3>Growth opportunities</h3>
    <ul>${insights.growthOpportunities.map((o) => `<li>${escapeHtml(o)}</li>`).join("")}</ul>
  `
  );

  const actionRows = insights.recommendations
    .map((r) => `<tr><td>${escapeHtml(r.level)}</td><td>${escapeHtml(r.target)}</td><td>${escapeHtml(r.reason)}</td><td>${r.expectedImpact.toFixed(2)}</td></tr>`)
    .join("");
  const page5 = page(
    "Action Plan",
    `
    <table class="data-table">
      <thead><tr><th>Level</th><th>Target</th><th>Reason</th><th>Expected Impact</th></tr></thead>
      <tbody>${actionRows}</tbody>
    </table>
  `
  );

  const hasExtended =
    insights.saturation != null ||
    insights.demand != null ||
    insights.efficiencyHistory != null ||
    insights.marketDepth != null ||
    insights.bundleImpact != null;
  const extraSections: string[] = [];
  if (hasExtended) {
    const sat = insights.saturation;
    const demand = insights.demand;
    const eff = insights.efficiencyHistory;
    const depth = insights.marketDepth;
    const bundle = insights.bundleImpact;
    extraSections.push(
      page(
        "Saturation, Demand & Market",
        `
        ${sat != null ? `
        <div class="summary-grid">
          <div class="summary-item"><span class="label">Marginal ROAS Slope</span><span class="value">${sat.marginalRoasSlope.toFixed(4)}</span></div>
          <div class="summary-item"><span class="label">Diminishing Returns</span><span class="value">${sat.diminishingReturnsDetected ? "Yes" : "No"}</span></div>
          <div class="summary-item"><span class="label">Recommended Max Budget</span><span class="value">$${sat.recommendedMaxBudget.toFixed(2)}</span></div>
          <div class="summary-item"><span class="label">Saturation Score</span><span class="value">${sat.saturationScore.toFixed(2)}</span></div>
        </div>
        ` : ""}
        ${demand != null ? `<h3>Demand</h3><p>Budget constraint: ${demand.budgetConstraintDetected ? "Yes" : "No"}. Rank constraint: ${demand.rankConstraintDetected ? "Yes" : "No"}. Scaling headroom: ${demand.scalingHeadroomPercent.toFixed(0)}%.</p>` : ""}
        ${eff != null ? `<h3>Efficiency trend</h3><p>${escapeHtml(eff.efficiencyTrend)}. Stability: ${eff.stabilityScore.toFixed(2)}.</p>` : ""}
        ${depth != null ? `<h3>Market depth</h3><p>Est. monthly demand: ${depth.estimatedMonthlyDemand.toFixed(0)}. Capture: ${depth.currentMarketCapturePercent.toFixed(1)}%. Confidence: ${(depth.demandConfidenceScore * 100).toFixed(0)}%.</p>` : ""}
        ${bundle != null && bundle.projectedRevenueLiftPercent > 0 ? `<h3>Bundle impact</h3><p>Projected revenue lift: ${bundle.projectedRevenueLiftPercent.toFixed(1)}%. Adoption est: ${(bundle.bundleAdoptionRateEstimate * 100).toFixed(0)}%.</p>` : ""}
      `
      )
    );
  }
  const extraHtml = extraSections.length > 0 ? "\n  " + extraSections.join("\n  ") : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Google Ads Summary Report</title>
  <style>
    @page { margin: 1in; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.5; color: #1a1a1a; max-width: 8.5in; margin: 0 auto; padding: 20px; }
    h1 { font-size: 22px; border-bottom: 2px solid #333; padding-bottom: 8px; }
    h2 { font-size: 16px; margin-top: 24px; page-break-before: auto; }
    h3 { font-size: 14px; margin-top: 12px; }
    .page { page-break-inside: avoid; margin-bottom: 24px; }
    .summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin: 16px 0; }
    .summary-item { padding: 8px; background: #f5f5f5; border-radius: 4px; }
    .summary-item .label { display: block; font-size: 11px; color: #666; text-transform: uppercase; }
    .summary-item .value { font-size: 16px; font-weight: 700; }
    .data-table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; }
    .data-table th, .data-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    .data-table th { background: #f0f0f0; }
    .meta { font-size: 12px; color: #666; }
    ul { margin: 8px 0; padding-left: 20px; }
  </style>
</head>
<body>
  <h1>Google Ads Summary Report</h1>
  ${page1}
  ${page2}
  ${page3}
  ${page4}
  ${page5}${extraHtml}
</body>
</html>`;
}
