"use client";

import React, { useEffect, useState, useCallback } from "react";
import { getIndicator } from "@/logic/business/ui/indicator-map";
import type { InsightsResponse, AggregatedMetrics } from "./types";
import type { Business } from "@/logic/business/business-model";
import { EmptyStatePanel } from "./EmptyStatePanel";
import indicatorStyles from "./workspace-indicators.module.css";
import styles from "./WorkspaceLayout.module.css";

function indicatorClass(colorToken: string): string {
  const map: Record<string, string> = {
    green: indicatorStyles.indicatorGreen,
    "light-green": indicatorStyles.indicatorLightGreen,
    gray: indicatorStyles.indicatorGray,
    "light-red": indicatorStyles.indicatorLightRed,
    red: indicatorStyles.indicatorRed,
    strongPositive: indicatorStyles.indicatorGreen,
    moderatePositive: indicatorStyles.indicatorLightGreen,
    neutral: indicatorStyles.indicatorGray,
    moderateNegative: indicatorStyles.indicatorLightRed,
    strongNegative: indicatorStyles.indicatorRed,
  };
  return map[colorToken] ?? indicatorStyles.indicatorGray;
}

type CampaignItem = { id: string; name: string; status: string; channelType: string; budget: number; metrics: { impressions: number; clicks: number; cost: number; conversions: number } };

function HourHeatmap({ byHour, metric = "roas" }: { byHour: Record<number, AggregatedMetrics>; metric?: "roas" | "conversionRate" }) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const values = hours.map((h) => {
    const m = byHour[h];
    if (!m) return 0;
    return metric === "roas" ? m.roas : m.conversionRate;
  });
  const max = Math.max(...values, 0.001);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
      {hours.map((h) => {
        const v = values[h];
        const pct = max > 0 ? Math.min(100, (v / max) * 100) : 0;
        const bg = `hsl(120, 60%, ${90 - pct * 0.5}%)`;
        return (
          <div
            key={h}
            title={`${h}:00 — ${metric === "roas" ? v.toFixed(2) : (v * 100).toFixed(2)}%`}
            style={{
              width: 20,
              height: 20,
              backgroundColor: bg,
              border: "1px solid #e5e7eb",
              borderRadius: 2,
              fontSize: 9,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {h}
          </div>
        );
      })}
    </div>
  );
}

function StateHeatmap({ byState, metric = "roas" }: { byState: Record<string, AggregatedMetrics>; metric?: "roas" | "conversionRate" }) {
  const entries = Object.entries(byState).filter(([, m]) => (m.cost ?? 0) > 0);
  const values = entries.map(([, m]) => (metric === "roas" ? m.roas : m.conversionRate));
  const max = Math.max(...values, 0.001);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
      {entries.map(([region, m]) => {
        const v = metric === "roas" ? m.roas : m.conversionRate;
        const pct = max > 0 ? Math.min(100, (v / max) * 100) : 0;
        const bg = `hsl(120, 60%, ${90 - pct * 0.5}%)`;
        return (
          <div
            key={region}
            title={`${region} — ${metric === "roas" ? v.toFixed(2) : (v * 100).toFixed(2)}%`}
            style={{
              padding: "2px 6px",
              backgroundColor: bg,
              border: "1px solid #e5e7eb",
              borderRadius: 4,
              fontSize: 11,
            }}
          >
            {region}
          </div>
        );
      })}
      {entries.length === 0 && <span className={styles.emptyState}>No state data</span>}
    </div>
  );
}

type DimensionKind = "by_state" | "by_hour" | "by_campaign";

function inferPrimaryDimension(insights: InsightsResponse): { kind: DimensionKind; options: string[] } {
  const byState = insights.byState ?? {};
  const byHour = insights.byHour ?? {};
  const byCampaign = insights.byCampaign ?? {};
  const stateKeys = Object.keys(byState);
  const hourKeys = Object.keys(byHour).map(String);
  const campaignKeys = Object.keys(byCampaign);
  if (stateKeys.length > 0) return { kind: "by_state", options: stateKeys };
  if (hourKeys.length > 0) return { kind: "by_hour", options: hourKeys.sort((a, b) => Number(a) - Number(b)) };
  if (campaignKeys.length > 0) return { kind: "by_campaign", options: campaignKeys };
  return { kind: "by_state", options: [] };
}

function getMetricsForDimension(
  insights: InsightsResponse,
  kind: DimensionKind,
  selectedValue: string
): AggregatedMetrics | undefined {
  if (!selectedValue) return undefined;
  if (kind === "by_state") return (insights.byState ?? {})[selectedValue];
  if (kind === "by_hour") return (insights.byHour ?? {})[Number(selectedValue)];
  if (kind === "by_campaign") return (insights.byCampaign ?? {})[selectedValue];
  return undefined;
}

/** List metric keys that exist and have a displayable value (number). */
function getMetricKeys(metrics: AggregatedMetrics | undefined): string[] {
  if (!metrics || typeof metrics !== "object") return [];
  return Object.keys(metrics).filter((k) => typeof (metrics as Record<string, unknown>)[k] === "number");
}

export function CompareTab({
  businessId,
  business,
  onNavigateToData,
}: {
  businessId: string;
  business: Business;
  onNavigateToData: () => void;
}) {
  if (businessId === undefined || businessId === "") {
    console.error("CompareTab: businessId is undefined or empty");
  }
  console.log("CompareTab businessId:", businessId);
  const isCsv = business?.dataSourceType === "csv";
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [selectedDimensionValue, setSelectedDimensionValue] = useState<string>("");
  const [selectedVariantIds, setSelectedVariantIds] = useState<Set<string>>(new Set());

  const fetchData = useCallback(() => {
    const insightsPromise = fetch(`/api/google-ads/insights?businessId=${encodeURIComponent(businessId)}`)
      .then((r) => r.json())
      .then((d: InsightsResponse) => setInsights(d))
      .catch(() => setInsights(null));
    if (isCsv) {
      return insightsPromise;
    }
    const campaignsPromise = fetch("/api/google-ads/campaigns")
      .then((r) => r.json())
      .then((d: { campaigns?: CampaignItem[] }) => setCampaigns(d.campaigns ?? []))
      .catch(() => setCampaigns([]));
    return Promise.all([insightsPromise, campaignsPromise]);
  }, [businessId, isCsv]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchData().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [fetchData]);

  useEffect(() => {
    if (!insights) return;
    if (isCsv) {
      const { kind, options } = inferPrimaryDimension(insights);
      if (options.length > 0 && !selectedDimensionValue) {
        setSelectedDimensionValue(options[0]);
      }
      if (typeof console !== "undefined" && console.log) {
        console.log("CompareTab data source: csv. Dropdown options:", options.length, "(", kind, ")");
      }
    } else {
      const byCampaign = insights.byCampaign ?? {};
      const campaignIds = campaigns.length > 0 ? campaigns.map((c) => c.id) : Object.keys(byCampaign);
      if (campaignIds.length > 0 && !selectedCampaignId) setSelectedCampaignId(campaignIds[0]);
    }
  }, [insights, isCsv, campaigns, selectedCampaignId, selectedDimensionValue]);

  const toggleVariant = (id: string) => {
    setSelectedVariantIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) return <div className={styles.section}>Loading…</div>;
  if (!insights) return <div className={styles.section}>Failed to load insights.</div>;
  if (insights.noData) return <EmptyStatePanel onGoToData={onNavigateToData} />;

  const byCampaign = insights.byCampaign ?? {};
  const byHour = insights.byHour ?? {};
  const byState = insights.byState ?? {};
  const slope = insights.trends?.numericSlope ?? 0;

  if (isCsv) {
    const { kind, options } = inferPrimaryDimension(insights);
    const selectedValue = selectedDimensionValue || options[0] || "";
    const metrics = getMetricsForDimension(insights, kind, selectedValue);
    const metricKeys = getMetricKeys(metrics);
    const dimensionLabel = kind === "by_state" ? "Region / State" : kind === "by_hour" ? "Hour" : "Campaign";

    return (
      <div className={styles.dashboard}>
        <section className={styles.section}>
          <h3 className={styles.chartTitle}>{dimensionLabel}</h3>
          <select
            className={styles.select}
            value={selectedValue}
            onChange={(e) => setSelectedDimensionValue(e.target.value)}
            aria-label={`Select ${dimensionLabel.toLowerCase()}`}
          >
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {kind === "by_hour" ? `${opt}:00` : opt}
              </option>
            ))}
          </select>
        </section>

        <section className={styles.section}>
          <h3 className={styles.chartTitle}>Metrics — {selectedValue || dimensionLabel}</h3>
          <div
            style={{
              padding: "1rem",
              background: "#f8fafc",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: "0.875rem",
            }}
          >
            {metricKeys.length === 0 ? (
              <span className={styles.emptyState}>No metrics for this selection.</span>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {metricKeys.map((key) => {
                  const val = (metrics as Record<string, unknown>)[key];
                  const num = typeof val === "number" ? val : 0;
                  const display = key === "conversionRate" || key === "roas" ? (key === "conversionRate" ? (num * 100).toFixed(2) + "%" : num.toFixed(2)) : Number.isFinite(num) ? num.toLocaleString() : String(val);
                  return (
                    <span key={key}>
                      <strong>{key}</strong>: {display}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {(Object.keys(byState).length > 0 || Object.keys(byHour).length > 0) && (
          <section className={styles.section}>
            {Object.keys(byState).length > 0 && (
              <div style={{ marginBottom: "1rem" }}>
                <h4 className={styles.chartTitle}>State heatmap</h4>
                <StateHeatmap byState={byState} />
              </div>
            )}
            {Object.keys(byHour).length > 0 && (
              <div>
                <h4 className={styles.chartTitle}>Hour heatmap</h4>
                <HourHeatmap byHour={byHour} />
              </div>
            )}
          </section>
        )}
      </div>
    );
  }

  const campaignIds = campaigns.length > 0 ? campaigns.map((c) => c.id) : Object.keys(byCampaign);
  const variantsToShow = campaignIds.filter((id) => selectedVariantIds.has(id) || (selectedVariantIds.size === 0 && id === selectedCampaignId));
  if (variantsToShow.length === 0 && campaignIds.length > 0) variantsToShow.push(selectedCampaignId || campaignIds[0]);

  return (
    <div className={styles.dashboard}>
      <section className={styles.section}>
        <h3 className={styles.chartTitle}>Campaign</h3>
        <select
          className={styles.select}
          value={selectedCampaignId}
          onChange={(e) => setSelectedCampaignId(e.target.value)}
          aria-label="Select campaign"
        >
          {campaigns.length > 0
            ? campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.id})
                </option>
              ))
            : Object.keys(byCampaign).map((id) => (
                <option key={id} value={id}>
                  Campaign {id}
                </option>
              ))}
        </select>
        <p className={styles.whyText} style={{ marginTop: "0.5rem" }}>
          Ad-level data not available for this source. Comparing campaign-level metrics.
        </p>
      </section>

      <section className={styles.section}>
        <h3 className={styles.chartTitle}>Compare variants (campaigns)</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
          {(campaigns.length > 0 ? campaigns : campaignIds.map((id) => ({ id, name: `Campaign ${id}` }))).map(
            (c: CampaignItem | { id: string; name: string }) => (
              <label key={c.id} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.875rem" }}>
                <input
                  type="checkbox"
                  checked={selectedVariantIds.size === 0 ? c.id === selectedCampaignId : selectedVariantIds.has(c.id)}
                  onChange={() => toggleVariant(c.id)}
                />
                {"name" in c ? c.name : (c as CampaignItem).name}
              </label>
            )
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
          {variantsToShow.map((campaignId) => {
            const metrics = byCampaign[campaignId];
            const campaign = campaigns.find((c) => c.id === campaignId);
            const name = campaign?.name ?? `Campaign ${campaignId}`;
            const m = metrics ?? (campaign?.metrics ? { ...campaign.metrics, revenue: 0, roas: 0, cpa: 0, conversionRate: 0 } : undefined);
            const roas = m?.cost ? (m.revenue ?? 0) / m.cost : 0;
            const cpa = m?.conversions ? (m.cost ?? 0) / m.conversions : 0;
            const convRate = m?.clicks ? (m.conversions ?? 0) / m.clicks : 0;
            const ind = getIndicator(roas, slope, { metric: "roas" });
            return (
              <div key={campaignId} className={styles.chartBlock} style={{ padding: "1rem" }}>
                <h4 className={styles.chartTitle}>Preview</h4>
                <div
                  style={{
                    padding: "0.75rem",
                    background: "#f8fafc",
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    fontSize: "0.8125rem",
                    color: "#64748b",
                  }}
                >
                  [Headline + description + image — placeholder]
                  <br />
                  <strong style={{ color: "#374151" }}>{name}</strong>
                </div>
                <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: 4 }}>
                  <span>Clicks: {m?.clicks ?? 0}</span>
                  <span>Conversion rate: {((convRate ?? 0) * 100).toFixed(2)}%</span>
                  <span className={indicatorClass(ind.color)}>ROAS: {(roas ?? 0).toFixed(2)} {ind.arrow}</span>
                  <span>CPA: ${(cpa ?? 0).toFixed(2)}</span>
                </div>
                <div style={{ marginTop: "0.75rem" }}>
                  <h4 className={styles.chartTitle}>Hour heatmap</h4>
                  <HourHeatmap byHour={byHour} />
                </div>
                <div style={{ marginTop: "0.75rem" }}>
                  <h4 className={styles.chartTitle}>State heatmap</h4>
                  <StateHeatmap byState={byState} />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
