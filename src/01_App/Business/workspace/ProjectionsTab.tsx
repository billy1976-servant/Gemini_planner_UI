"use client";

import React, { useEffect, useState } from "react";
import { getIndicator } from "@/logic/business/ui/indicator-map";
import type { ProjectionSnapshot, ProjectionCompareResult } from "./types";
import {
  RoasOverTimeChart,
  ProjectionVarianceChart,
  type VariancePoint,
} from "./charts";
import indicatorStyles from "./workspace-indicators.module.css";
import styles from "./WorkspaceLayout.module.css";

function indicatorClass(colorToken: string): string {
  const map: Record<string, string> = {
    green: indicatorStyles.indicatorGreen,
    "light-green": indicatorStyles.indicatorLightGreen,
    gray: indicatorStyles.indicatorGray,
    "light-red": indicatorStyles.indicatorLightRed,
    red: indicatorStyles.indicatorRed,
  };
  return map[colorToken] ?? indicatorStyles.indicatorGray;
}

export function ProjectionsTab() {
  const [snapshots, setSnapshots] = useState<ProjectionSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);
  const [compareResult, setCompareResult] = useState<ProjectionCompareResult | null>(null);
  const [varianceData, setVarianceData] = useState<VariancePoint[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/google-ads/projection-snapshots")
      .then((r) => r.json())
      .then((d: { snapshots?: ProjectionSnapshot[] }) => {
        if (!cancelled) setSnapshots(d.snapshots ?? []);
      })
      .catch(() => {
        if (!cancelled) setSnapshots([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

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
    Promise.all(
      snapshots.map((s) =>
        fetch(`/api/google-ads/projection-compare?id=${encodeURIComponent(s.id)}`)
          .then((r) => r.json())
          .then((d: { comparison?: ProjectionCompareResult }) => ({ snapshot: s, comparison: d.comparison }))
          .catch(() => ({ snapshot: s, comparison: null }))
      )
    ).then((results) => {
      const points: VariancePoint[] = results
        .filter((r) => r.comparison != null)
        .map((r) => ({
          snapshotId: r.snapshot.id,
          date: new Date(r.snapshot.createdAt ?? r.snapshot.timestamp).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          }),
          dateMs: r.snapshot.createdAt ?? r.snapshot.timestamp,
          accuracyScore: r.comparison!.accuracyScore,
          varianceROAS: r.comparison!.varianceROAS,
          varianceCPA: r.comparison!.varianceCPA,
        }));
      setVarianceData(points.sort((a, b) => a.dateMs - b.dateMs));
    });
  }, [snapshots]);

  if (loading) {
    return <div className={styles.section}>Loading projection snapshots…</div>;
  }

  const sorted = [...snapshots].sort(
    (a, b) => (a.createdAt ?? a.timestamp) - (b.createdAt ?? b.timestamp)
  );

  return (
    <div className={styles.dashboard}>
      <h2 className={styles.pageTitle}>Projections</h2>

      <div className={styles.snapshotSelector}>
        <label htmlFor="projections-snapshot-select">Compare snapshot</label>
        <select
          id="projections-snapshot-select"
          value={selectedSnapshotId ?? ""}
          onChange={(e) => setSelectedSnapshotId(e.target.value || null)}
          className={styles.select}
        >
          <option value="">— Select —</option>
          {sorted.map((s) => (
            <option key={s.id} value={s.id}>
              {new Date(s.createdAt ?? s.timestamp).toLocaleString()} · ROAS {s.projectedROAS.toFixed(2)}
            </option>
          ))}
        </select>
      </div>

      {compareResult && (
        <div className={styles.compareResult}>
          <p>
            <span
              className={indicatorClass(
                compareResult.accuracyScore >= 0.9
                  ? "green"
                  : compareResult.accuracyScore >= 0.6
                    ? "light-green"
                    : "gray"
              )}
            >
              accuracyScore: {(compareResult.accuracyScore * 100).toFixed(0)}%
            </span>
          </p>
          <p>adjustmentRecommendation: {compareResult.adjustmentRecommendation}</p>
        </div>
      )}

      <div className={styles.chartBlock}>
        <h4 className={styles.chartTitle}>Projected ROAS over time</h4>
        <RoasOverTimeChart snapshots={sorted} />
      </div>

      <div className={styles.chartBlock}>
        <h4 className={styles.chartTitle}>Accuracy over time</h4>
        <ProjectionVarianceChart data={varianceData} />
      </div>

      <ul className={styles.projectionsList}>
        {sorted.map((s) => (
          <li key={s.id}>
            ROAS {s.projectedROAS.toFixed(2)} · Budget ${s.projectedBudget.toLocaleString()} ·{" "}
            {new Date(s.createdAt ?? s.timestamp).toLocaleString()}
          </li>
        ))}
      </ul>
      {sorted.length === 0 && (
        <p className={styles.emptyState}>No projection snapshots yet.</p>
      )}
    </div>
  );
}
