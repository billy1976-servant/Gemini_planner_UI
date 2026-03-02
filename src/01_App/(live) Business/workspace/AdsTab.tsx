"use client";

import React, { useEffect, useState, useCallback } from "react";
import { getIndicator } from "@/logic/business/ui/indicator-map";
import type { InsightsResponse, AggregatedMetrics } from "./types";
import type { AdDefinition } from "@/logic/business/execute";
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

function HourHeatmap({
  byHour,
  metric = "roas",
}: {
  byHour: Record<number, AggregatedMetrics>;
  metric?: "roas" | "conversionRate";
}) {
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

function StateTable({
  byState,
}: {
  byState: Record<string, AggregatedMetrics>;
}) {
  const entries = Object.entries(byState).filter(([, m]) => (m.cost ?? 0) > 0);
  if (entries.length === 0) return <span className={styles.emptyState}>No state data</span>;
  return (
    <table style={{ width: "100%", fontSize: "0.8125rem", borderCollapse: "collapse" }}>
      <thead>
        <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
          <th style={{ textAlign: "left", padding: "0.35rem 0.5rem" }}>State</th>
          <th style={{ textAlign: "right", padding: "0.35rem 0.5rem" }}>ROAS</th>
          <th style={{ textAlign: "right", padding: "0.35rem 0.5rem" }}>CPA</th>
          <th style={{ textAlign: "right", padding: "0.35rem 0.5rem" }}>Spend</th>
          <th style={{ textAlign: "right", padding: "0.35rem 0.5rem" }}>Revenue</th>
        </tr>
      </thead>
      <tbody>
        {entries.map(([region, m]) => (
          <tr key={region} style={{ borderBottom: "1px solid #f3f4f6" }}>
            <td style={{ padding: "0.35rem 0.5rem" }}>{region}</td>
            <td style={{ textAlign: "right", padding: "0.35rem 0.5rem" }}>{m.roas.toFixed(2)}</td>
            <td style={{ textAlign: "right", padding: "0.35rem 0.5rem" }}>${m.cpa.toFixed(2)}</td>
            <td style={{ textAlign: "right", padding: "0.35rem 0.5rem" }}>${m.cost.toFixed(2)}</td>
            <td style={{ textAlign: "right", padding: "0.35rem 0.5rem" }}>${m.revenue.toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const FLOW_VIEWER_PATH = "tsx:(live) Business/onboarding/FlowViewer";

export function AdsTab({
  businessId,
  onNavigateToData,
}: {
  businessId: string;
  onNavigateToData?: () => void;
}) {
  const [definitions, setDefinitions] = useState<AdDefinition[]>([]);
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [createAdForm, setCreateAdForm] = useState({
    id: "",
    campaignId: "",
    variantId: "",
    headlines: "",
    descriptions: "",
    finalUrl: "",
    displayUrl: "",
    callToAction: "",
    onboardingFlowId: "",
  });
  const [saveAdStatus, setSaveAdStatus] = useState<{ ok?: boolean; error?: string } | null>(null);

  const fetchData = useCallback(() => {
    const defPromise = fetch(
      `/api/google-ads/ad-definitions?businessId=${encodeURIComponent(businessId)}`
    )
      .then((r) => r.json())
      .then((d: { definitions?: AdDefinition[]; error?: string }) => {
        if (d.error) throw new Error(d.error);
        setDefinitions(d.definitions ?? []);
      })
      .catch(() => setDefinitions([]));

    const insightsPromise = fetch(
      `/api/google-ads/insights?businessId=${encodeURIComponent(businessId)}`
    )
      .then((r) => r.json())
      .then((d: InsightsResponse) => setInsights(d))
      .catch(() => setInsights(null));

    return Promise.all([defPromise, insightsPromise]);
  }, [businessId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchData().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [fetchData]);

  const toggleVariant = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSaveAd = async () => {
    setSaveAdStatus(null);
    const headlines = createAdForm.headlines.split(",").map((s) => s.trim()).filter(Boolean);
    const descriptions = createAdForm.descriptions.split(",").map((s) => s.trim()).filter(Boolean);
    if (!createAdForm.id.trim()) {
      setSaveAdStatus({ error: "id is required" });
      return;
    }
    if (!createAdForm.campaignId.trim()) {
      setSaveAdStatus({ error: "campaignId is required" });
      return;
    }
    if (headlines.length === 0) {
      setSaveAdStatus({ error: "At least one headline required" });
      return;
    }
    if (descriptions.length === 0) {
      setSaveAdStatus({ error: "At least one description required" });
      return;
    }
    try {
      const res = await fetch("/api/google-ads/ad-definitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          id: createAdForm.id.trim(),
          campaignId: createAdForm.campaignId.trim(),
          variantId: (createAdForm.variantId.trim() || createAdForm.id.trim()),
          headlines,
          descriptions,
          finalUrl: createAdForm.finalUrl.trim() || "https://example.com",
          displayUrl: createAdForm.displayUrl.trim() || "example.com",
          callToAction: createAdForm.callToAction.trim() || "Learn more",
          onboardingFlowId: createAdForm.onboardingFlowId.trim() || undefined,
          status: "active",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveAdStatus({ error: data.error || "Save failed" });
        return;
      }
      setSaveAdStatus({ ok: true });
      setCreateAdForm({
        id: "",
        campaignId: "",
        variantId: "",
        headlines: "",
        descriptions: "",
        finalUrl: "",
        displayUrl: "",
        callToAction: "",
        onboardingFlowId: "",
      });
      fetchData();
    } catch (e) {
      setSaveAdStatus({ error: e instanceof Error ? e.message : "Save failed" });
    }
  };

  const selected =
    selectedIds.size > 0
      ? definitions.filter((d) => selectedIds.has(d.id))
      : definitions.length > 0
        ? [definitions[0]]
        : [];
  const byCampaign = insights?.byCampaign ?? {};
  const byHour = insights?.byHour ?? {};
  const byState = insights?.byState ?? {};
  const slope = insights?.trends?.numericSlope ?? 0;
  const execSummary = insights?.executiveSummary;

  if (loading) {
    return <div className={styles.section}>Loading…</div>;
  }

  if (!insights) {
    return (
      <div className={styles.section}>
        Failed to load insights.
        {onNavigateToData && (
          <button
            type="button"
            className={styles.reportButton}
            style={{ marginTop: "0.5rem" }}
            onClick={onNavigateToData}
          >
            Go to Data
          </button>
        )}
      </div>
    );
  }

  if (insights.noData) {
    return (
      <EmptyStatePanel
        onGoToData={onNavigateToData ?? (() => {})}
      />
    );
  }

  return (
    <div className={styles.dashboard}>
      {/* Create New Ad */}
      <section className={styles.section} aria-label="Create new ad" style={{ marginBottom: "1rem" }}>
        <h3 className={styles.chartTitle}>Create New Ad</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.5rem", alignItems: "center", maxWidth: 720 }}>
          <label style={{ fontSize: "0.8125rem" }}>
            id <input type="text" className={styles.select} value={createAdForm.id} onChange={(e) => setCreateAdForm((f) => ({ ...f, id: e.target.value }))} placeholder="e.g. my-ad-1" style={{ width: "100%", marginLeft: 4 }} />
          </label>
          <label style={{ fontSize: "0.8125rem" }}>
            campaignId <input type="text" className={styles.select} value={createAdForm.campaignId} onChange={(e) => setCreateAdForm((f) => ({ ...f, campaignId: e.target.value }))} placeholder="e.g. 100001" style={{ width: "100%", marginLeft: 4 }} />
          </label>
          <label style={{ fontSize: "0.8125rem" }}>
            variantId <input type="text" className={styles.select} value={createAdForm.variantId} onChange={(e) => setCreateAdForm((f) => ({ ...f, variantId: e.target.value }))} placeholder="optional, defaults to id" style={{ width: "100%", marginLeft: 4 }} />
          </label>
          <label style={{ fontSize: "0.8125rem", gridColumn: "1 / -1" }}>
            headlines (comma-separated) <input type="text" className={styles.select} value={createAdForm.headlines} onChange={(e) => setCreateAdForm((f) => ({ ...f, headlines: e.target.value }))} placeholder="Headline 1, Headline 2" style={{ width: "100%", marginLeft: 4 }} />
          </label>
          <label style={{ fontSize: "0.8125rem", gridColumn: "1 / -1" }}>
            descriptions (comma-separated) <input type="text" className={styles.select} value={createAdForm.descriptions} onChange={(e) => setCreateAdForm((f) => ({ ...f, descriptions: e.target.value }))} placeholder="Description 1, Description 2" style={{ width: "100%", marginLeft: 4 }} />
          </label>
          <label style={{ fontSize: "0.8125rem" }}>
            finalUrl <input type="text" className={styles.select} value={createAdForm.finalUrl} onChange={(e) => setCreateAdForm((f) => ({ ...f, finalUrl: e.target.value }))} placeholder="https://..." style={{ width: "100%", marginLeft: 4 }} />
          </label>
          <label style={{ fontSize: "0.8125rem" }}>
            displayUrl <input type="text" className={styles.select} value={createAdForm.displayUrl} onChange={(e) => setCreateAdForm((f) => ({ ...f, displayUrl: e.target.value }))} placeholder="example.com" style={{ width: "100%", marginLeft: 4 }} />
          </label>
          <label style={{ fontSize: "0.8125rem" }}>
            callToAction <input type="text" className={styles.select} value={createAdForm.callToAction} onChange={(e) => setCreateAdForm((f) => ({ ...f, callToAction: e.target.value }))} placeholder="Learn more" style={{ width: "100%", marginLeft: 4 }} />
          </label>
          <label style={{ fontSize: "0.8125rem" }}>
            onboardingFlowId (optional) <input type="text" className={styles.select} value={createAdForm.onboardingFlowId} onChange={(e) => setCreateAdForm((f) => ({ ...f, onboardingFlowId: e.target.value }))} placeholder="e.g. container-direct-buy" style={{ width: "100%", marginLeft: 4 }} />
          </label>
        </div>
        <div style={{ marginTop: "0.5rem" }}>
          <button type="button" className={styles.reportButton} onClick={handleSaveAd}>Save Ad</button>
          {saveAdStatus?.ok && <span style={{ marginLeft: 8, color: "#059669", fontSize: "0.8125rem" }}>Saved.</span>}
          {saveAdStatus?.error && <span style={{ marginLeft: 8, color: "#dc2626", fontSize: "0.8125rem" }}>{saveAdStatus.error}</span>}
        </div>
      </section>

      {/* Top: three columns */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(180px, 1fr) minmax(260px, 2fr) minmax(260px, 1fr)",
          gap: "1rem",
          alignItems: "stretch",
        }}
      >
        {/* Left — Ad variants */}
        <section className={styles.section} aria-label="Ad variants">
          <h3 className={styles.chartTitle}>Variants</h3>
          {definitions.length === 0 ? (
            <p className={styles.emptyState}>No ad definitions. Add JSON under Business_Files/…/ads/</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {definitions.map((d) => (
                <li key={d.id} style={{ marginBottom: "0.5rem" }}>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: "0.875rem",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.size === 0 ? d.id === selected[0]?.id : selectedIds.has(d.id)}
                      onChange={() => toggleVariant(d.id)}
                    />
                    <span title={d.variantId}>{d.variantId}</span>
                    {d.onboardingFlowId && (
                      <span style={{ color: "#6b7280", fontSize: "0.75rem" }}>+ flow</span>
                    )}
                  </label>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Center — Creative preview */}
        <section className={styles.section} aria-label="Creative preview">
          <h3 className={styles.chartTitle}>Creative preview</h3>
          {selected.length === 0 ? (
            <p className={styles.emptyState}>Select a variant</p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  selected.length > 1
                    ? "repeat(auto-fill, minmax(220px, 1fr))"
                    : "1fr",
                gap: "1rem",
              }}
            >
              {selected.map((ad) => (
                <div
                  key={ad.id}
                  className={styles.chartBlock}
                  style={{
                    padding: "1rem",
                    background: "#f8fafc",
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "0.5rem" }}>
                    {ad.variantId} · {ad.status}
                  </div>
                  {ad.headlines.length > 0 && (
                    <div style={{ marginBottom: "0.5rem" }}>
                      <strong style={{ fontSize: "0.8125rem" }}>Headlines</strong>
                      <ul style={{ margin: "0.25rem 0 0 1rem", padding: 0, fontSize: "0.8125rem" }}>
                        {ad.headlines.map((h, i) => (
                          <li key={i}>{h}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {ad.descriptions.length > 0 && (
                    <div style={{ marginBottom: "0.5rem" }}>
                      <strong style={{ fontSize: "0.8125rem" }}>Descriptions</strong>
                      <ul style={{ margin: "0.25rem 0 0 1rem", padding: 0, fontSize: "0.8125rem" }}>
                        {ad.descriptions.map((d, i) => (
                          <li key={i}>{d}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div style={{ fontSize: "0.8125rem", marginBottom: "0.25rem" }}>
                    <strong>Final URL:</strong>{" "}
                    <a href={ad.finalUrl} target="_blank" rel="noopener noreferrer" style={{ wordBreak: "break-all" }}>
                      {ad.finalUrl}
                    </a>
                  </div>
                  <div style={{ fontSize: "0.8125rem", marginBottom: "0.25rem" }}>
                    <strong>Display URL:</strong> {ad.displayUrl}
                  </div>
                  <div style={{ fontSize: "0.8125rem" }}>
                    <strong>CTA:</strong> {ad.callToAction}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Right — Connected onboarding */}
        <section className={styles.section} aria-label="Connected onboarding">
          <h3 className={styles.chartTitle}>Onboarding flow</h3>
          {selected.length === 0 || !selected[0].onboardingFlowId ? (
            <p className={styles.emptyState}>
              {selected.length === 0
                ? "Select a variant"
                : "No linked flow for this variant"}
            </p>
          ) : (
            <>
              <p style={{ fontSize: "0.8125rem", marginBottom: "0.5rem" }}>
                Flow: <strong>{selected[0].onboardingFlowId}</strong>
              </p>
              <a
                href={`/dev?screen=${encodeURIComponent(FLOW_VIEWER_PATH)}&flow=${encodeURIComponent(selected[0].onboardingFlowId)}&view=client`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.reportButton}
                style={{ display: "inline-block", marginBottom: "0.75rem" }}
              >
                Open flow in new tab
              </a>
              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  overflow: "hidden",
                  minHeight: 320,
                  background: "#fff",
                }}
              >
                <iframe
                  title={`Onboarding flow: ${selected[0].onboardingFlowId}`}
                  src={`/dev?screen=${encodeURIComponent(FLOW_VIEWER_PATH)}&flow=${encodeURIComponent(selected[0].onboardingFlowId)}&view=client`}
                  style={{
                    width: "100%",
                    height: 360,
                    border: "none",
                  }}
                />
              </div>
            </>
          )}
        </section>
      </div>

      {/* Bottom — Performance tracker */}
      <section className={styles.section} aria-label="Performance">
        <h3 className={styles.chartTitle}>Performance</h3>
        {selected.length === 0 ? (
          <p className={styles.emptyState}>Select a variant to see campaign performance</p>
        ) : (
          <>
            {/* Campaign-level metrics from insights (no local math) */}
            <div className={styles.metricsGrid} style={{ marginBottom: "1rem" }}>
              {selected.map((ad) => {
                const m = byCampaign[ad.campaignId] ?? execSummary;
                const roas = m?.roas ?? 0;
                const cpa = m?.cpa ?? 0;
                const cost = (m && "cost" in m ? m.cost : execSummary?.totalSpend) ?? 0;
                const revenue = (m && "revenue" in m ? m.revenue : execSummary?.totalRevenue) ?? 0;
                const ind = getIndicator(roas, slope, { metric: "roas" });
                return (
                  <div key={ad.id} className={styles.metricCard}>
                    <span className={styles.metricLabel}>{ad.variantId}</span>
                    <span className={indicatorClass(ind.color)}>
                      ROAS {roas.toFixed(2)} {ind.arrow}
                    </span>
                    <span className={styles.metricValue}>CPA ${cpa.toFixed(2)}</span>
                    <span className={styles.metricValue}>Spend ${cost.toFixed(2)}</span>
                    <span className={styles.metricValue}>Revenue ${revenue.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
            {Object.keys(byHour).length > 0 && (
              <div style={{ marginBottom: "1rem" }}>
                <h4 className={styles.chartTitle}>By hour</h4>
                <HourHeatmap byHour={byHour} />
              </div>
            )}
            {Object.keys(byState).length > 0 && (
              <div>
                <h4 className={styles.chartTitle}>By state</h4>
                <StateTable byState={byState} />
              </div>
            )}
          </>
        )}
      </section>

      {/* Side-by-side comparison table when multiple selected */}
      {selected.length > 1 && (
        <section className={styles.section} aria-label="Variant comparison">
          <h3 className={styles.chartTitle}>Side-by-side comparison</h3>
          <table style={{ width: "100%", fontSize: "0.875rem", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <th style={{ textAlign: "left", padding: "0.5rem" }}>Variant</th>
                <th style={{ textAlign: "right", padding: "0.5rem" }}>ROAS</th>
                <th style={{ textAlign: "right", padding: "0.5rem" }}>CPA</th>
                <th style={{ textAlign: "right", padding: "0.5rem" }}>Conv. rate</th>
                <th style={{ textAlign: "right", padding: "0.5rem" }}>Spend</th>
                <th style={{ textAlign: "right", padding: "0.5rem" }}>Revenue</th>
                <th style={{ textAlign: "center", padding: "0.5rem" }}>Trend</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const rows = selected.map((ad) => {
                  const m = byCampaign[ad.campaignId];
                  const roas = m?.roas ?? 0;
                  const cpa = m?.cpa ?? 0;
                  const convRate = m?.conversionRate ?? 0;
                  const cost = m?.cost ?? 0;
                  const revenue = m?.revenue ?? 0;
                  const ind = getIndicator(roas, slope, { metric: "roas" });
                  return { ad, roas, cpa, convRate, cost, revenue, ind };
                });
                const maxRoas = Math.max(...rows.map((r) => r.roas), 0.001);
                const minCpa = Math.min(...rows.map((r) => r.cpa).filter((c) => c > 0), Infinity) || 0;
                return rows.map(({ ad, roas, cpa, convRate, cost, revenue, ind }) => (
                  <tr key={ad.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "0.5rem" }}>{ad.variantId}</td>
                    <td
                      style={{
                        textAlign: "right",
                        padding: "0.5rem",
                        ...(roas >= maxRoas && maxRoas > 0 ? { fontWeight: 600 } : {}),
                      }}
                      className={indicatorClass(ind.color)}
                    >
                      {roas.toFixed(2)} {ind.arrow}
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        padding: "0.5rem",
                        ...(cpa > 0 && cpa <= minCpa ? { fontWeight: 600 } : {}),
                      }}
                    >
                      ${cpa.toFixed(2)}
                    </td>
                    <td style={{ textAlign: "right", padding: "0.5rem" }}>
                      {(convRate * 100).toFixed(2)}%
                    </td>
                    <td style={{ textAlign: "right", padding: "0.5rem" }}>${cost.toFixed(2)}</td>
                    <td style={{ textAlign: "right", padding: "0.5rem" }}>${revenue.toFixed(2)}</td>
                    <td style={{ textAlign: "center", padding: "0.5rem" }} className={indicatorClass(ind.color)}>
                      {ind.arrow}
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
          <p style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.5rem" }}>
            Highest ROAS and lowest CPA highlighted. Colors from indicator-map.
          </p>
        </section>
      )}
    </div>
  );
}
