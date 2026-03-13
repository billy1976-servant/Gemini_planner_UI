"use client";

import React, { useEffect, useState, useCallback } from "react";
import { getIndicator } from "@/logic/business/ui/indicator-map";
import type { InsightsResponse } from "./types";
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

function deriveHealthStatus(data: InsightsResponse): "healthy" | "warning" | "critical" | "unknown" {
  if (data.noData) return "unknown";
  const roas = data.executiveSummary?.roas ?? 0;
  const slope = data.trends?.numericSlope ?? 0;
  const ind = getIndicator(roas, slope, { metric: "roas" });
  if (ind.severity === "strong" && ind.color === "green") return "healthy";
  if (ind.color === "red" || ind.color === "strongNegative") return "critical";
  if (ind.color === "light-red" || ind.color === "moderateNegative") return "warning";
  return "healthy";
}

const CONFIDENCE_LOW = 0.5;
const VOLATILITY_SLOPE = 0.1;

export function CommandCenterTab({
  businessId,
  onNavigateToData,
}: {
  businessId: string;
  onNavigateToData: () => void;
}) {
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [whyExpanded, setWhyExpanded] = useState<string | null>(null);

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

  if (loading) {
    return <div className={styles.section}>Loading…</div>;
  }
  if (!insights) {
    return <div className={styles.section}>Failed to load insights.</div>;
  }
  if (insights.noData) {
    return <EmptyStatePanel onGoToData={onNavigateToData} />;
  }

  const health = deriveHealthStatus(insights);
  const confidence = insights.projectionConfidenceScore ?? 0;
  const confidenceInd =
    confidence >= 0.8 ? "green" : confidence >= 0.5 ? "light-green" : confidence >= 0.3 ? "gray" : "light-red";
  const recs = insights.recommendations ?? [];
  const urgentActions = recs.filter(
    (r) => r.level === "reduce" || r.level === "pause" || (r.level === "increase" && (r.expectedImpact ?? 0) > 0)
  );
  const scaleSuggestions = recs.filter((r) => r.level === "increase");
  const cutSuggestions = recs.filter((r) => r.level === "reduce" || r.level === "pause");
  const budgetRecs = recs.filter((r) => r.target === "Budget" || r.target === "budget");
  const topAction =
    recs.length > 0
      ? recs.reduce((best, r) => ((r.expectedImpact ?? 0) > (best.expectedImpact ?? 0) ? r : best), recs[0])
      : null;

  const riskAlerts: Array<{ id: string; label: string; severity: "low" | "medium" | "high" }> = [];
  if (confidence < CONFIDENCE_LOW) {
    riskAlerts.push({
      id: "low-confidence",
      label: `Low confidence (${(confidence * 100).toFixed(0)}%). Consider more data or narrower date range.`,
      severity: "high",
    });
  }
  if (Math.abs(insights.trends?.numericSlope ?? 0) > VOLATILITY_SLOPE) {
    riskAlerts.push({
      id: "volatility",
      label: `Volatile trend (${insights.trends?.trendDirection ?? "unknown"}). Review before scaling.`,
      severity: "medium",
    });
  }
  (insights.ranking?.worstStates ?? []).slice(0, 2).forEach((s, i) => {
    riskAlerts.push({
      id: `worst-state-${i}`,
      label: `Underperforming region: ${s.region} (ROAS ${(s.metrics?.roas ?? 0).toFixed(2)})`,
      severity: "medium",
    });
  });
  (insights.ranking?.worstHours ?? []).slice(0, 2).forEach((h, i) => {
    riskAlerts.push({
      id: `worst-hour-${i}`,
      label: `Weak hour: ${h.hour}:00 (ROAS ${(h.metrics?.roas ?? 0).toFixed(2)})`,
      severity: "low",
    });
  });

  return (
    <div className={styles.dashboard}>
      {/* Top: Health, Confidence, Urgent Actions */}
      <section className={styles.section} aria-label="Command status">
        <div className={styles.sectionSummary} style={{ marginBottom: "0.75rem" }}>
          <span className={styles.healthBadge} data-health={health}>
            {health === "healthy" ? "Healthy" : health === "warning" ? "Warning" : health === "critical" ? "Critical" : "—"}
          </span>
          <span className={indicatorClass(confidenceInd)}>
            Confidence {(confidence * 100).toFixed(0)}%
          </span>
        </div>
        <h3 className={styles.chartTitle}>Urgent Actions</h3>
        {urgentActions.length > 0 ? (
          <ul className={styles.recommendationList}>
            {urgentActions.map((r, i) => (
              <li key={i}>
                <strong>{r.level}</strong> — {r.reason}
                {r.expectedImpact != null && r.expectedImpact !== 0 && (
                  <span className={indicatorClass(r.expectedImpact > 0 ? "green" : "gray")}>
                    {" "}
                    (expected impact: ${r.expectedImpact.toLocaleString()})
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.emptyState}>No urgent actions.</p>
        )}
      </section>

      {/* Phase 5: Highlight highest-impact action + Why? + expectedImpact */}
      {topAction && (
        <section className={styles.section} aria-label="Top recommendation">
          <h3 className={styles.chartTitle}>Highest-impact action</h3>
          <div className={styles.compareResult}>
            <p>
              <strong>{topAction.level}</strong> — {topAction.target}: {topAction.reason}
            </p>
            <p>
              <span className={indicatorClass(topAction.expectedImpact > 0 ? "green" : "gray")}>
                Expected impact: ${topAction.expectedImpact.toLocaleString()}
              </span>
            </p>
            <button
              type="button"
              className={styles.reportButton}
              style={{ marginTop: "0.5rem" }}
              onClick={() => setWhyExpanded(whyExpanded === "top" ? null : "top")}
              aria-expanded={whyExpanded === "top"}
            >
              {whyExpanded === "top" ? "Hide detail" : "Why?"}
            </button>
            {whyExpanded === "top" && (
              <div style={{ marginTop: "0.5rem", paddingTop: "0.5rem", borderTop: "1px solid #e5e7eb" }}>
                <p className={styles.whyText}>
                  <strong>Reason:</strong> {topAction.reason}
                </p>
                <p className={styles.whyText}>
                  <strong>Target:</strong> {topAction.target}
                </p>
                <p className={styles.whyText}>
                  <strong>Expected impact:</strong> ${topAction.expectedImpact.toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Middle: Ranked Opportunities */}
      <section className={styles.section} aria-label="Ranked opportunities">
        <h3 className={styles.chartTitle}>Ranked Opportunities</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {scaleSuggestions.length > 0 && (
            <div>
              <h4 style={{ fontSize: "0.875rem", margin: "0 0 0.5rem 0", color: "#374151" }}>Scale</h4>
              <ul className={styles.recommendationList}>
                {scaleSuggestions.map((r, i) => (
                  <li key={i}>
                    {r.reason} — <span className={indicatorClass("green")}>${(r.expectedImpact ?? 0).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {cutSuggestions.length > 0 && (
            <div>
              <h4 style={{ fontSize: "0.875rem", margin: "0 0 0.5rem 0", color: "#374151" }}>Cut</h4>
              <ul className={styles.recommendationList}>
                {cutSuggestions.map((r, i) => (
                  <li key={i}>
                    {r.reason} — <span className={indicatorClass("gray")}>${(r.expectedImpact ?? 0).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {budgetRecs.length > 0 && (
            <div>
              <h4 style={{ fontSize: "0.875rem", margin: "0 0 0.5rem 0", color: "#374151" }}>Budget shifts</h4>
              <ul className={styles.recommendationList}>
                {budgetRecs.map((r, i) => (
                  <li key={i}>
                    {r.reason} — expected impact ${(r.expectedImpact ?? 0).toLocaleString()}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {insights.capacity && (insights.capacity.projectedSafeBudget > 0 || insights.capacity.projectedAggressiveBudget > 0) && (
            <p className={styles.whyText}>
              Safe budget: ${insights.capacity.projectedSafeBudget.toLocaleString()} · Aggressive: $
              {insights.capacity.projectedAggressiveBudget.toLocaleString()}
            </p>
          )}
          {scaleSuggestions.length === 0 && cutSuggestions.length === 0 && budgetRecs.length === 0 && (
            <p className={styles.emptyState}>No ranked opportunities.</p>
          )}
        </div>
      </section>

      {/* Bottom: Risk Alerts */}
      <section className={styles.section} aria-label="Risk alerts">
        <h3 className={styles.chartTitle}>Risk Alerts</h3>
        {riskAlerts.length > 0 ? (
          <ul className={styles.recommendationList}>
            {riskAlerts.map((a) => (
              <li key={a.id}>
                <span
                  className={
                    a.severity === "high"
                      ? indicatorClass("red")
                      : a.severity === "medium"
                        ? indicatorClass("light-red")
                        : indicatorClass("gray")
                  }
                >
                  {a.label}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.emptyState}>No risk alerts.</p>
        )}
      </section>
    </div>
  );
}
