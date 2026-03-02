"use client";

import React, { useEffect, useState, useCallback } from "react";
import { getIndicator, getIndicatorForMetric } from "@/logic/business/ui/indicator-map";
import type { Business } from "@/logic/business/business-model";
import type { InsightsResponse, ProjectionSnapshot, ProjectionCompareResult } from "./types";
import {
  AccordionSection,
  AccordionControls,
  type SectionId,
} from "./Accordion";
import {
  RoasOverTimeChart,
  RevenueVsSpendChart,
  CpaTrendChart,
  ProjectionVarianceChart,
  HeadroomGauge,
} from "./charts";
import type { VariancePoint } from "./charts";
import { EmptyStatePanel } from "./EmptyStatePanel";
import indicatorStyles from "./workspace-indicators.module.css";
import styles from "./WorkspaceLayout.module.css";

const SECTION_IDS: SectionId[] = [
  "business-health",
  "performance-flow",
  "market-insights",
  "growth-capacity",
  "recommendations",
  "projections",
  "reports",
];

type ClarityMode = "full" | "signal";

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

export function OverviewPage({
  businessId,
  business,
  clarityMode,
  onNavigateToData,
}: {
  businessId: string;
  business: Business;
  clarityMode: ClarityMode;
  onNavigateToData: () => void;
}) {
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [snapshots, setSnapshots] = useState<ProjectionSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<SectionId>>(new Set(["business-health"]));
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);
  const [compareResult, setCompareResult] = useState<ProjectionCompareResult | null>(null);
  const [varianceData, setVarianceData] = useState<VariancePoint[]>([]);

  const fetchInsights = useCallback(() => {
    return fetch(`/api/google-ads/insights?businessId=${encodeURIComponent(businessId)}`)
      .then((r) => r.json())
      .then((d: InsightsResponse) => setInsights(d))
      .catch(() => setInsights(null));
  }, [businessId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetchInsights(),
      fetch("/api/google-ads/projection-snapshots")
        .then((r) => r.json())
        .then((d: { snapshots?: ProjectionSnapshot[] }) => {
          if (!cancelled) setSnapshots(d.snapshots ?? []);
        })
        .catch(() => !cancelled && setSnapshots([])),
    ]).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [fetchInsights]);

  useEffect(() => {
    if (!selectedSnapshotId) {
      setCompareResult(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/google-ads/projection-compare?id=${encodeURIComponent(selectedSnapshotId)}`)
      .then((r) => r.json())
      .then((d: { comparison?: ProjectionCompareResult }) => {
        if (!cancelled) setCompareResult(d.comparison ?? null);
      })
      .catch(() => !cancelled && setCompareResult(null));
    return () => { cancelled = true; };
  }, [selectedSnapshotId]);

  useEffect(() => {
    if (snapshots.length === 0) {
      setVarianceData([]);
      return;
    }
    const ids = snapshots.map((s) => s.id);
    Promise.all(
      ids.map((id) =>
        fetch(`/api/google-ads/projection-compare?id=${encodeURIComponent(id)}`)
          .then((r) => r.json())
          .then((d: { comparison?: ProjectionCompareResult }) => ({ id, comparison: d.comparison }))
          .catch(() => ({ id, comparison: null }))
      )
    ).then((results) => {
      const points: VariancePoint[] = results
        .filter((r) => r.comparison != null)
        .map((r) => {
          const s = snapshots.find((x) => x.id === r.id)!;
          return {
            snapshotId: r.id,
            date: new Date(s.createdAt ?? s.timestamp).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            }),
            dateMs: s.createdAt ?? s.timestamp,
            accuracyScore: r.comparison!.accuracyScore,
            varianceROAS: r.comparison!.varianceROAS,
            varianceCPA: r.comparison!.varianceCPA,
          };
        });
      setVarianceData(points.sort((a, b) => a.dateMs - b.dateMs));
    });
  }, [snapshots]);

  const toggleSection = useCallback((id: SectionId) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => setExpanded(new Set(SECTION_IDS)), []);
  const collapseAll = useCallback(() => setExpanded(new Set()), []);

  if (loading) {
    return <div className={styles.section}>Loading insights…</div>;
  }

  if (!insights) {
    return (
      <div className={styles.section}>
        <p>Failed to load insights.</p>
      </div>
    );
  }

  if (insights.noData) {
    return <EmptyStatePanel onGoToData={onNavigateToData} />;
  }

  const summary: NonNullable<InsightsResponse["executiveSummary"]> = insights.executiveSummary ?? ({} as NonNullable<InsightsResponse["executiveSummary"]>);
  const roas = summary.roas ?? 0;
  const slope = insights.trends?.numericSlope ?? 0;
  const roasIndicator = getIndicator(roas, slope, { metric: "roas" });
  const headroom =
    insights.demand?.scalingHeadroomPercent ?? insights.marketDepth?.scalingHeadroomPercent ?? null;
  const confidenceIndicator =
    insights.projectionConfidenceScore != null
      ? getIndicatorForMetric("demandConfidenceScore", insights.projectionConfidenceScore)
      : null;
  const health = deriveHealthStatus(insights);
  const sortedSnapshots = [...snapshots].sort(
    (a, b) => (a.createdAt ?? a.timestamp) - (b.createdAt ?? b.timestamp)
  );

  return (
    <div className={styles.overviewPage}>
      <AccordionControls
        expanded={expanded}
        sectionIds={SECTION_IDS}
        onExpandAll={expandAll}
        onCollapseAll={collapseAll}
      />

      <AccordionSection
        id="business-health"
        expanded={expanded.has("business-health")}
        onToggle={() => toggleSection("business-health")}
        summary={
          <span className={styles.sectionSummary}>
            <span className={styles.healthBadge} data-health={health}>
              {health === "healthy" ? "Healthy" : health === "warning" ? "Warning" : health === "critical" ? "Critical" : "—"}
            </span>
            <span className={confidenceIndicator ? indicatorClass(confidenceIndicator.color) : ""}>
              Confidence {(insights.projectionConfidenceScore ?? 0) * 100}%
            </span>
            <span>{headroom != null ? `${headroom.toFixed(0)}% headroom` : "—"}</span>
          </span>
        }
        summaryClassName={styles.businessHealthTrigger}
      >
        <div className={styles.chartBlock}>
          <h4 className={styles.chartTitle}>ROAS over time</h4>
          <RoasOverTimeChart snapshots={sortedSnapshots} />
        </div>
        <p className={styles.whyText}>
          Trend: {insights.trends?.trendDirection ?? "—"} (slope {slope.toFixed(4)}). Contributing: ROAS {roas.toFixed(2)} {roasIndicator.arrow}.
        </p>
      </AccordionSection>

      <AccordionSection
        id="performance-flow"
        expanded={expanded.has("performance-flow")}
        onToggle={() => toggleSection("performance-flow")}
        summary={
          <span className={styles.sectionSummary}>
            <span className={indicatorClass(roasIndicator.color)}>
              Revenue {roasIndicator.arrow}
            </span>
            <span className={indicatorClass(roasIndicator.color)}>Spend {roasIndicator.arrow}</span>
          </span>
        }
      >
        <div className={styles.chartBlock}>
          <RevenueVsSpendChart
            revenue={summary.totalRevenue ?? 0}
            spend={summary.totalSpend ?? 0}
          />
        </div>
        <div className={styles.chartBlock}>
          <h4 className={styles.chartTitle}>ROAS trend</h4>
          <span className={indicatorClass(roasIndicator.color)}>
            {roas.toFixed(2)} {roasIndicator.arrow}
          </span>
        </div>
        <div className={styles.chartBlock}>
          <h4 className={styles.chartTitle}>CPA trend</h4>
          <CpaTrendChart cpa={summary.cpa ?? 0} trendSlope={slope} />
        </div>
      </AccordionSection>

      <AccordionSection
        id="market-insights"
        expanded={expanded.has("market-insights")}
        onToggle={() => toggleSection("market-insights")}
        summary={
          <span className={styles.sectionSummary}>
            Top state: {summary.topState ?? "—"} · Top hour: {summary.topHour != null ? `${summary.topHour}:00` : "—"}
          </span>
        }
      >
        <div className={styles.rankingTable}>
          <h4 className={styles.chartTitle}>Top states</h4>
          <table className={styles.table}>
            <tbody>
              {insights.ranking?.topStates?.slice(0, 10).map((s, i) => {
                const ind = getIndicator(s.metrics?.roas ?? 0, slope, { metric: "roas" });
                return (
                  <tr key={i}>
                    <td>{s.region}</td>
                    <td className={indicatorClass(ind.color)}>
                      ROAS {(s.metrics?.roas ?? 0).toFixed(2)} {ind.arrow}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className={styles.rankingTable}>
          <h4 className={styles.chartTitle}>Top hours</h4>
          <table className={styles.table}>
            <tbody>
              {insights.ranking?.topHours?.slice(0, 10).map((h, i) => {
                const ind = getIndicator(h.metrics?.roas ?? 0, slope, { metric: "roas" });
                return (
                  <tr key={i}>
                    <td>{h.hour}:00</td>
                    <td className={indicatorClass(ind.color)}>
                      ROAS {(h.metrics?.roas ?? 0).toFixed(2)} {ind.arrow}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </AccordionSection>

      <AccordionSection
        id="growth-capacity"
        expanded={expanded.has("growth-capacity")}
        onToggle={() => toggleSection("growth-capacity")}
        summary={
          <span className={styles.sectionSummary}>
            Safe budget: ${(insights.capacity?.projectedSafeBudget ?? 0).toLocaleString()} · Aggressive: ${(insights.capacity?.projectedAggressiveBudget ?? 0).toLocaleString()}
          </span>
        }
      >
        {headroom != null && <HeadroomGauge percent={headroom} className={styles.gaugeBlock} />}
        <p className={styles.explainer}>
          Saturation and demand from current signals. Capacity model uses safe and aggressive expansion based on current performance.
        </p>
      </AccordionSection>

      <AccordionSection
        id="recommendations"
        expanded={expanded.has("recommendations")}
        onToggle={() => toggleSection("recommendations")}
        summary={
          <span className={styles.sectionSummary}>
            {(insights.recommendations?.length ?? 0) > 0
              ? `${insights.recommendations!.length} opportunities detected`
              : "No recommendations"}
          </span>
        }
      >
        <ul className={styles.recommendationList}>
          {insights.recommendations?.map((r, i) => (
            <li key={i}>
              <strong>{r.level}</strong> — {r.reason} (expected impact: ${r.expectedImpact.toLocaleString()})
            </li>
          ))}
        </ul>
        {(!insights.recommendations || insights.recommendations.length === 0) && (
          <p className={styles.emptyState}>No recommendations.</p>
        )}
      </AccordionSection>

      <AccordionSection
        id="projections"
        expanded={expanded.has("projections")}
        onToggle={() => toggleSection("projections")}
        summary={
          <span className={styles.sectionSummary}>
            {snapshots.length} snapshot{snapshots.length !== 1 ? "s" : ""}
          </span>
        }
      >
        <div className={styles.snapshotSelector}>
          <label htmlFor="snapshot-select">Compare snapshot</label>
          <select
            id="snapshot-select"
            value={selectedSnapshotId ?? ""}
            onChange={(e) => setSelectedSnapshotId(e.target.value || null)}
            className={styles.select}
          >
            <option value="">— Select —</option>
            {sortedSnapshots.map((s) => (
              <option key={s.id} value={s.id}>
                {new Date(s.createdAt ?? s.timestamp).toLocaleString()} · ROAS {s.projectedROAS.toFixed(2)}
              </option>
            ))}
          </select>
        </div>
        {compareResult && (
          <div className={styles.compareResult}>
            <p>
              <span className={indicatorClass(compareResult.accuracyScore >= 0.9 ? "green" : compareResult.accuracyScore >= 0.6 ? "light-green" : "gray")}>
                Accuracy: {(compareResult.accuracyScore * 100).toFixed(0)}%
              </span>
            </p>
            <p>{compareResult.adjustmentRecommendation}</p>
          </div>
        )}
        <div className={styles.chartBlock}>
          <h4 className={styles.chartTitle}>Accuracy over time</h4>
          <ProjectionVarianceChart data={varianceData} />
        </div>
      </AccordionSection>

      <AccordionSection
        id="reports"
        expanded={expanded.has("reports")}
        onToggle={() => toggleSection("reports")}
        summary={<span className={styles.sectionSummary}>Generate report</span>}
      >
        <div className={styles.reportActions}>
          <a
            href="/api/reports/google-ads-summary"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.reportButton}
          >
            Open HTML Report
          </a>
          <button
            type="button"
            className={styles.reportButton}
            onClick={() => window.open("/api/reports/google-ads-summary", "_blank")}
          >
            Print to PDF
          </button>
        </div>
        <p className={styles.explainer}>
          Open the report in a new tab, then use browser Print → Save as PDF.
        </p>
      </AccordionSection>
    </div>
  );
}
