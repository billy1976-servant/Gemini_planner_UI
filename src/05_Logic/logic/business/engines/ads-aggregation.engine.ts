/**
 * Ads Aggregation Engine — JSON only.
 * Input: BusinessSignal[] (google-ads).
 * Output: totals, byState, byHour, byCampaign with roas, cpa, conversionRate.
 * No UI; no side effects.
 */

import type { BusinessSignal } from "../business-signal";

export interface AggregatedMetrics {
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  revenue: number;
  roas: number;
  cpa: number;
  conversionRate: number;
}

function computeDerived(impressions: number, clicks: number, cost: number, conversions: number, revenue: number): Omit<AggregatedMetrics, "impressions" | "clicks" | "cost" | "conversions" | "revenue"> {
  const roas = cost > 0 && revenue >= 0 ? revenue / cost : 0;
  const cpa = conversions > 0 ? cost / conversions : 0;
  const conversionRate = clicks > 0 ? conversions / clicks : 0;
  return { roas, cpa, conversionRate };
}

function toAggregated(impressions: number, clicks: number, cost: number, conversions: number, revenue: number): AggregatedMetrics {
  const { roas, cpa, conversionRate } = computeDerived(impressions, clicks, cost, conversions, revenue);
  return {
    impressions,
    clicks,
    cost,
    conversions,
    revenue: revenue ?? 0,
    roas,
    cpa,
    conversionRate,
  };
}

function sumMetrics(signals: BusinessSignal[]): AggregatedMetrics {
  let impressions = 0;
  let clicks = 0;
  let cost = 0;
  let conversions = 0;
  let revenue = 0;
  for (const s of signals) {
    impressions += s.metrics.impressions ?? 0;
    clicks += s.metrics.clicks ?? 0;
    cost += s.metrics.cost ?? 0;
    conversions += s.metrics.conversions ?? 0;
    revenue += s.metrics.revenue ?? 0;
  }
  return toAggregated(impressions, clicks, cost, conversions, revenue);
}

export interface AdsAggregationInput {
  signals: BusinessSignal[];
}

export interface AdsAggregationOutput {
  totals: AggregatedMetrics;
  byState: Record<string, AggregatedMetrics>;
  byHour: Record<number, AggregatedMetrics>;
  byCampaign: Record<string, AggregatedMetrics>;
}

/**
 * Aggregate google-ads signals by totals, state, hour, campaign.
 * Missing region → bucket as "Unknown". Hour 0–23.
 */
export function runAdsAggregation(input: AdsAggregationInput): AdsAggregationOutput {
  const { signals } = input;
  const adsSignals = signals.filter((s) => s.source === "google-ads");

  const byState: Record<string, { impressions: number; clicks: number; cost: number; conversions: number; revenue: number }> = {};
  const byHour: Record<number, { impressions: number; clicks: number; cost: number; conversions: number; revenue: number }> = {};
  const byCampaign: Record<string, { impressions: number; clicks: number; cost: number; conversions: number; revenue: number }> = {};

  function addState(region: string | undefined, m: BusinessSignal["metrics"]) {
    const key = region ?? "Unknown";
    if (!byState[key]) byState[key] = { impressions: 0, clicks: 0, cost: 0, conversions: 0, revenue: 0 };
    byState[key].impressions += m.impressions ?? 0;
    byState[key].clicks += m.clicks ?? 0;
    byState[key].cost += m.cost ?? 0;
    byState[key].conversions += m.conversions ?? 0;
    byState[key].revenue += m.revenue ?? 0;
  }
  function addHour(h: number | undefined, m: BusinessSignal["metrics"]) {
    const key = h ?? -1;
    if (!byHour[key]) byHour[key] = { impressions: 0, clicks: 0, cost: 0, conversions: 0, revenue: 0 };
    byHour[key].impressions += m.impressions ?? 0;
    byHour[key].clicks += m.clicks ?? 0;
    byHour[key].cost += m.cost ?? 0;
    byHour[key].conversions += m.conversions ?? 0;
    byHour[key].revenue += m.revenue ?? 0;
  }
  function addCampaign(cid: string | undefined, m: BusinessSignal["metrics"]) {
    const key = cid ?? "Unknown";
    if (!byCampaign[key]) byCampaign[key] = { impressions: 0, clicks: 0, cost: 0, conversions: 0, revenue: 0 };
    byCampaign[key].impressions += m.impressions ?? 0;
    byCampaign[key].clicks += m.clicks ?? 0;
    byCampaign[key].cost += m.cost ?? 0;
    byCampaign[key].conversions += m.conversions ?? 0;
    byCampaign[key].revenue += m.revenue ?? 0;
  }

  const campaignLevelSignals = adsSignals.filter((s) => s.hour === undefined);
  const hourlySignals = adsSignals.filter((s) => s.hour !== undefined);

  for (const s of campaignLevelSignals) {
    const m = s.metrics;
    addState(s.region, m);
    if (s.campaignId) addCampaign(s.campaignId, m);
  }
  for (const s of hourlySignals) {
    addHour(s.hour!, s.metrics);
    // When region is present, also group by region so each unique region produces a bucket.
    if (s.region) addState(s.region, s.metrics);
  }

  // Totals from campaign-level only to avoid double-counting when hourly also present
  const totals = campaignLevelSignals.length > 0 ? sumMetrics(campaignLevelSignals) : sumMetrics(adsSignals);

  const outByState: Record<string, AggregatedMetrics> = {};
  for (const [k, v] of Object.entries(byState)) {
    outByState[k] = toAggregated(v.impressions, v.clicks, v.cost, v.conversions, v.revenue);
  }
  const outByHour: Record<number, AggregatedMetrics> = {};
  for (const [k, v] of Object.entries(byHour)) {
    const num = Number(k);
    if (num >= 0 && num <= 23) outByHour[num] = toAggregated(v.impressions, v.clicks, v.cost, v.conversions, v.revenue);
  }
  const outByCampaign: Record<string, AggregatedMetrics> = {};
  for (const [k, v] of Object.entries(byCampaign)) {
    outByCampaign[k] = toAggregated(v.impressions, v.clicks, v.cost, v.conversions, v.revenue);
  }

  return {
    totals,
    byState: outByState,
    byHour: outByHour,
    byCampaign: outByCampaign,
  };
}
