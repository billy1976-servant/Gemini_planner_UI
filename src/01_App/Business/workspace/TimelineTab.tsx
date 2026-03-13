"use client";

import React, { useEffect, useState, useCallback } from "react";
import type { InsightsResponse, AggregatedMetrics } from "./types";
import { EmptyStatePanel } from "./EmptyStatePanel";
import styles from "./WorkspaceLayout.module.css";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function TimelineTab({
  businessId,
  onNavigateToData,
}: {
  businessId: string;
  onNavigateToData: () => void;
}) {
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [hourActive, setHourActive] = useState<Record<number, boolean>>(() => {
    const o: Record<number, boolean> = {};
    HOURS.forEach((h) => (o[h] = true));
    return o;
  });
  const [intensityMetric, setIntensityMetric] = useState<"roas" | "conversionRate">("roas");

  const fetchInsights = useCallback(() => {
    return fetch(`/api/google-ads/insights?businessId=${encodeURIComponent(businessId)}`)
      .then((r) => r.json())
      .then((d: InsightsResponse) => setInsights(d))
      .catch(() => setInsights(null));
  }, [businessId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchInsights().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [fetchInsights]);

  const toggleHour = (h: number) => {
    setHourActive((prev) => ({ ...prev, [h]: !prev[h] }));
  };

  if (loading) return <div className={styles.section}>Loading…</div>;
  if (!insights) return <div className={styles.section}>Failed to load insights.</div>;
  if (insights.noData) return <EmptyStatePanel onGoToData={onNavigateToData} />;

  const byHour = insights.byHour ?? {};
  const hasHourlyData = Object.keys(byHour).length > 0;

  const getIntensity = (h: number): number => {
    const m = byHour[h] as AggregatedMetrics | undefined;
    if (!m) return 0;
    return intensityMetric === "roas" ? m.roas : m.conversionRate;
  };

  const allIntensities = HOURS.map(getIntensity);
  const maxIntensity = Math.max(...allIntensities, 0.001);

  return (
    <div className={styles.dashboard}>
      <section className={styles.section}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
          <h3 className={styles.chartTitle} style={{ margin: 0 }}>Timeline</h3>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.875rem" }}>
            Intensity:
            <select
              className={styles.select}
              style={{ minWidth: "auto", width: "auto" }}
              value={intensityMetric}
              onChange={(e) => setIntensityMetric(e.target.value as "roas" | "conversionRate")}
            >
              <option value="roas">ROAS</option>
              <option value="conversionRate">Conversion rate</option>
            </select>
          </label>
        </div>

        {!hasHourlyData && (
          <p className={styles.whyText} style={{ marginBottom: "1rem" }}>
            No hourly data for this source. Grid shows structure; connect data with hour breakdown or use mock/CSV for intensity.
          </p>
        )}

        <div style={{ overflowX: "auto" }}>
          <table className={styles.table} style={{ minWidth: 600 }}>
            <thead>
              <tr>
                <th style={{ padding: "0.5rem", textAlign: "left", borderBottom: "2px solid #e5e7eb" }}>Hour</th>
                {DAYS.map((d) => (
                  <th key={d} style={{ padding: "0.5rem", textAlign: "center", borderBottom: "2px solid #e5e7eb" }}>
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HOURS.map((h) => {
                const intensity = getIntensity(h);
                const pct = maxIntensity > 0 ? Math.min(100, (intensity / maxIntensity) * 100) : 0;
                const bg = hasHourlyData ? `hsl(120, 50%, ${90 - pct * 0.4}%)` : "#f8fafc";
                const active = hourActive[h];
                return (
                  <tr key={h}>
                    <td style={{ padding: "0.35rem 0.5rem", borderBottom: "1px solid #f1f5f9", whiteSpace: "nowrap" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8125rem" }}>
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={() => toggleHour(h)}
                          title="Toggle hour (UI only)"
                        />
                        {h}:00
                      </label>
                    </td>
                    {DAYS.map((day) => (
                      <td
                        key={day}
                        style={{
                          padding: "0.35rem",
                          borderBottom: "1px solid #f1f5f9",
                          backgroundColor: active ? bg : "#f1f5f9",
                          minWidth: 64,
                          textAlign: "center",
                          fontSize: "0.75rem",
                          color: hasHourlyData && active ? "#374151" : "#94a3b8",
                        }}
                        title={
                          hasHourlyData
                            ? `${day} ${h}:00 — ${intensityMetric}: ${intensityMetric === "roas" ? intensity.toFixed(2) : (intensity * 100).toFixed(2)}%`
                            : "No hourly data"
                        }
                      >
                        {hasHourlyData && active
                          ? intensityMetric === "roas"
                            ? intensity.toFixed(1)
                            : (intensity * 100).toFixed(1) + "%"
                          : "—"}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className={styles.whyText} style={{ marginTop: "1rem" }}>
          Weekly grid (Mon–Sun) × hours (0–23). Intensity from {intensityMetric}. Per-hour toggle is UI only (no backend).
        </p>

        {hasHourlyData && (
          <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <h4 className={styles.chartTitle}>Hour-level summary</h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {HOURS.map((h) => {
                const m = byHour[h];
                if (!m) return null;
                return (
                  <span
                    key={h}
                    style={{
                      padding: "2px 8px",
                      background: "#f1f5f9",
                      borderRadius: 4,
                      fontSize: "0.75rem",
                    }}
                  >
                    {h}:00 ROAS {m.roas.toFixed(2)} · Conv {(m.conversionRate * 100).toFixed(1)}%
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
