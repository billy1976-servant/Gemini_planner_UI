"use client";

import React, { useEffect, useState, useCallback } from "react";
import styles from "./WorkspaceLayout.module.css";

interface StrategyOption {
  id: string;
  label: string;
  description: string;
}

interface EvaluateResponse {
  ok: boolean;
  noData?: boolean;
  error?: string;
  businessId?: string;
  strategyId?: string;
  counts?: { signals: number; byStateKeys: number; byHourKeys: number; byCampaignKeys: number };
  strategy?: { id: string; label: string; description: string };
  inputs?: {
    totalsSummary: unknown;
    segmentCounts: { states: number; hours: number; campaigns: number };
  };
  wasteSegments?: Array<{
    segmentType: string;
    key: string;
    metrics: Record<string, number>;
    score: number;
    reason: string;
  }>;
  winnerSegments?: Array<{
    segmentType: string;
    key: string;
    metrics: Record<string, number>;
    score: number;
    reason: string;
  }>;
  reallocationPlan?: Array<{
    from: { segmentType: string; key: string };
    to: { segmentType: string; key: string };
    amount: number;
    reason: string;
  }>;
  raw?: unknown;
  debug?: unknown;
}

interface CsvBusinessItem {
  businessId: string;
  sourceFile: string;
}

/** One option per file (same source as Data tab Files dropdown). */
interface CsvFileOption {
  businessId: string;
  filename: string;
}

/** Full strategy definition for Active Strategy Parameters (from API). */
interface StrategyParams {
  id?: string;
  label?: string;
  description?: string;
  segmentTypes?: string[];
  rules?: {
    waste?: { minCost?: number; maxRoas?: number; minClicks?: number; maxConversions?: number };
    winners?: { minRoas?: number; minConversions?: number; minCost?: number };
  };
  scoring?: Record<string, number>;
  reallocation?: { enabled?: boolean; percentOfSpendToMove?: number };
}

export function DecisionConsoleTab({ businessId: workspaceBusinessId }: { businessId: string }) {
  const [csvFileOptions, setCsvFileOptions] = useState<CsvFileOption[]>([]);
  const [selectedCsvFileKey, setSelectedCsvFileKey] = useState<string>("");
  const [strategies, setStrategies] = useState<StrategyOption[]>([]);
  const [strategyId, setStrategyId] = useState<string>("");
  const [result, setResult] = useState<EvaluateResponse | null>(null);
  const [loadingStrategies, setLoadingStrategies] = useState(true);
  const [loadingCsvBusinesses, setLoadingCsvBusinesses] = useState(true);
  const [loadingEvaluate, setLoadingEvaluate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeStrategyParams, setActiveStrategyParams] = useState<StrategyParams | null>(null);
  const [deleteFileLoading, setDeleteFileLoading] = useState(false);

  const loadCsvFileOptions = useCallback(() => {
    setLoadingCsvBusinesses(true);
    fetch("/api/business/csv/business-ids")
      .then((r) => r.json())
      .then((d: { ok?: boolean; businesses?: CsvBusinessItem[] }) => {
        // #region agent log
        fetch("http://127.0.0.1:7242/ingest/7e15e045-3112-419f-8116-3226c0884ac1", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "df01c7" },
          body: JSON.stringify({
            sessionId: "df01c7",
            location: "DecisionConsoleTab.tsx:business-ids.then",
            message: "business-ids API response",
            data: { ok: d.ok, businesses: d.businesses, count: (d.businesses as CsvBusinessItem[] | undefined)?.length },
            timestamp: Date.now(),
            hypothesisId: "A",
          }),
        }).catch(() => {});
        // #endregion
        console.log("[DecisionConsole] business-ids response:", d);
        if (!d.ok || !Array.isArray(d.businesses) || d.businesses.length === 0) {
          setCsvFileOptions([]);
          setSelectedCsvFileKey("");
          setLoadingCsvBusinesses(false);
          return;
        }
        const businessIds = d.businesses.map((b) => b.businessId);
        const filePromises = businessIds.map((bid) =>
          fetch(`/api/business/csv/files?businessId=${encodeURIComponent(bid)}`).then((res) => res.json())
        );
        Promise.all(filePromises).then((responses) => {
          const options: CsvFileOption[] = [];
          responses.forEach((resp: { ok?: boolean; files?: { filename: string }[] }, i) => {
            const bid = businessIds[i];
            if (resp.ok && Array.isArray(resp.files)) {
              resp.files.forEach((f: { filename: string }) => {
                options.push({ businessId: bid, filename: f.filename });
              });
            }
          });
          setCsvFileOptions(options);
          setSelectedCsvFileKey((prev) => {
            const prevId = prev ? prev.split("|")[0] : "";
            if (options.length === 0) return "";
            const sameBusiness = options.find((o) => o.businessId === prevId);
            if (sameBusiness) return `${sameBusiness.businessId}|${sameBusiness.filename}`;
            return `${options[0].businessId}|${options[0].filename}`;
          });
        }).finally(() => setLoadingCsvBusinesses(false));
      })
      .catch(() => {
        setCsvFileOptions([]);
        setSelectedCsvFileKey("");
        setLoadingCsvBusinesses(false);
      });
  }, []);

  useEffect(() => {
    loadCsvFileOptions();
  }, [loadCsvFileOptions]);

  useEffect(() => {
    fetch("/api/decision-console/strategies")
      .then((r) => r.json())
      .then((d: { ok?: boolean; strategies?: StrategyOption[] }) => {
        if (d.ok && Array.isArray(d.strategies)) {
          setStrategies(d.strategies);
          if (d.strategies.length > 0) {
            setStrategyId((prev) => (prev && d.strategies!.some((s) => s.id === prev) ? prev : d.strategies![0].id));
          }
        }
      })
      .catch(() => setStrategies([]))
      .finally(() => setLoadingStrategies(false));
  }, []);

  const activeBusinessId = selectedCsvFileKey ? selectedCsvFileKey.split("|")[0] : "";

  const handleDeleteSelectedFile = useCallback(async () => {
    if (!selectedCsvFileKey) return;
    const pipe = selectedCsvFileKey.indexOf("|");
    const businessId = pipe >= 0 ? selectedCsvFileKey.slice(0, pipe) : "";
    const filename = pipe >= 0 ? selectedCsvFileKey.slice(pipe + 1) : "";
    if (!businessId || !filename) return;
    if (!confirm(`Delete "${filename}"? This cannot be undone.`)) return;
    setDeleteFileLoading(true);
    try {
      const res = await fetch(
        `/api/business/csv/files?businessId=${encodeURIComponent(businessId)}&filename=${encodeURIComponent(filename)}`,
        { method: "DELETE" }
      );
      const data = await res.json().catch(() => ({}));
      if (data.ok) {
        setSelectedCsvFileKey("");
        setResult(null);
        loadCsvFileOptions();
      } else {
        setError(data.reason ?? "Delete failed");
      }
    } finally {
      setDeleteFileLoading(false);
    }
  }, [selectedCsvFileKey, loadCsvFileOptions]);

  const fetchEvaluate = useCallback(() => {
    if (!strategyId) {
      setResult(null);
      return;
    }
    setLoadingEvaluate(true);
    setError(null);
    const url = `/api/decision-console/evaluate?businessId=${encodeURIComponent(activeBusinessId)}&strategyId=${encodeURIComponent(strategyId)}`;
    fetch(url)
      .then((r) => r.json())
      .then((d: EvaluateResponse) => {
        setResult(d);
        if (!d.ok) setError(d.error ?? "Evaluate failed");
        else setError(null);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Request failed");
        setResult(null);
      })
      .finally(() => setLoadingEvaluate(false));
  }, [activeBusinessId, strategyId]);

  useEffect(() => {
    if (!strategyId) return;
    fetchEvaluate();
  }, [strategyId, activeBusinessId, fetchEvaluate]);

  useEffect(() => {
    if (!strategyId) {
      setActiveStrategyParams(null);
      return;
    }
    fetch("/api/decision-console/strategy?strategyId=" + encodeURIComponent(strategyId))
      .then((r) => r.json())
      .then((d: { ok?: boolean; strategy?: StrategyParams }) => {
        if (d.ok && d.strategy) setActiveStrategyParams(d.strategy);
        else setActiveStrategyParams(null);
      })
      .catch(() => setActiveStrategyParams(null));
  }, [strategyId]);

  useEffect(() => {
    console.log("Selected businessId:", activeBusinessId);
    console.log("[DecisionConsole] businessId=%s strategyId=%s", activeBusinessId, strategyId);
  }, [activeBusinessId, strategyId]);

  useEffect(() => {
    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/7e15e045-3112-419f-8116-3226c0884ac1", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "df01c7" },
      body: JSON.stringify({
        sessionId: "df01c7",
        location: "DecisionConsoleTab.tsx:dropdownState",
        message: "Decision dropdown options (sourceFile, businessId)",
        data: {
          csvFileOptions: csvFileOptions.map((o) => ({ businessId: o.businessId, filename: o.filename })),
          selectedCsvFileKey,
          activeBusinessId,
        },
        timestamp: Date.now(),
        hypothesisId: "D",
      }),
    }).catch(() => {});
    // #endregion
  }, [csvFileOptions, activeBusinessId, selectedCsvFileKey]);

  const selectedStrategy = strategies.find((s) => s.id === strategyId);

  if (loadingStrategies || loadingCsvBusinesses) {
    return (
      <div className={styles.section}>
        <h2 className={styles.sectionSummary}>Decision Console</h2>
        <p>Loading strategies and CSV businesses…</p>
      </div>
    );
  }

  const hasBusinessId = activeBusinessId != null && String(activeBusinessId).trim() !== "";

  return (
    <div className={styles.dashboard}>
      <section className={styles.section} aria-label="Decision Console">
        <h2 className={styles.sectionSummary} style={{ marginBottom: "0.75rem" }}>
          Decision Console
        </h2>
        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="dc-csv-business" style={{ marginRight: "0.5rem", fontSize: "0.875rem" }}>
            CSV Business
          </label>
          <select
            id="dc-csv-business"
            value={selectedCsvFileKey}
            onChange={(e) => setSelectedCsvFileKey(e.target.value)}
            style={{ padding: "0.35rem 0.6rem", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: "0.875rem" }}
            aria-label="Select CSV file (same list as Data tab Files dropdown)"
          >
            <option value="">— None —</option>
            {csvFileOptions.map((o) => {
              const key = `${o.businessId}|${o.filename}`;
              return (
                <option key={key} value={key}>
                  {o.filename}
                </option>
              );
            })}
          </select>
          {selectedCsvFileKey && (
            <button
              type="button"
              onClick={handleDeleteSelectedFile}
              disabled={deleteFileLoading}
              style={{
                marginLeft: "0.5rem",
                padding: "0.35rem 0.6rem",
                fontSize: "0.8125rem",
                color: "#b91c1c",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 6,
                cursor: deleteFileLoading ? "not-allowed" : "pointer",
              }}
              aria-label="Delete selected file"
            >
              {deleteFileLoading ? "Deleting…" : "Delete file"}
            </button>
          )}
          <span style={{ marginLeft: "0.5rem", fontSize: "0.8125rem", color: "#6b7280" }}>
            businessId: <code style={{ background: "#f1f5f9", padding: "0.15rem 0.35rem", borderRadius: 4 }}>{hasBusinessId ? activeBusinessId : "(empty)"}</code>
          </span>
        </div>
        {!hasBusinessId && (
          <p style={{ color: "#b91c1c", fontWeight: 600, marginBottom: "0.75rem" }}>
            Warning: No CSV business selected. Upload CSV data in the Data tab (with a CSV business selected in the header).
          </p>
        )}
        {strategies.length === 0 && (
          <p style={{ padding: "1rem", background: "#fef3c7", border: "1px solid #f59e0b", borderRadius: 8, marginBottom: "1rem" }}>
            No strategies found in <code>src/config/decision-console/strategies</code>. Add JSON strategy files there.
          </p>
        )}
        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="dc-strategy" style={{ marginRight: "0.5rem", fontSize: "0.875rem" }}>
            Strategy
          </label>
          <select
            id="dc-strategy"
            value={strategyId}
            onChange={(e) => setStrategyId(e.target.value)}
            style={{ padding: "0.35rem 0.6rem", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: "0.875rem" }}
          >
            <option value="">— Select —</option>
            {strategies.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          {selectedStrategy?.description && (
            <p style={{ marginTop: "0.5rem", color: "#6b7280", fontSize: "0.8125rem" }}>{selectedStrategy.description}</p>
          )}
        </div>

        {/* Active Strategy Parameters (read-only, from strategy definition) */}
        {activeStrategyParams && (
          <div className={styles.section} style={{ marginBottom: "1rem" }}>
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "0.9375rem" }}>Active Strategy Parameters</h3>
            <dl style={{ margin: 0, fontSize: "0.8125rem", display: "grid", gridTemplateColumns: "auto 1fr", gap: "0.25rem 1rem" }}>
              {activeStrategyParams.rules?.waste && (
                <>
                  {typeof activeStrategyParams.rules.waste.minCost === "number" && (
                    <><dt style={{ color: "#6b7280" }}>waste.minCost</dt><dd>{activeStrategyParams.rules.waste.minCost}</dd></>
                  )}
                  {typeof activeStrategyParams.rules.waste.maxRoas === "number" && (
                    <><dt style={{ color: "#6b7280" }}>waste.maxRoas</dt><dd>{activeStrategyParams.rules.waste.maxRoas}</dd></>
                  )}
                  {typeof activeStrategyParams.rules.waste.minClicks === "number" && (
                    <><dt style={{ color: "#6b7280" }}>waste.minClicks</dt><dd>{activeStrategyParams.rules.waste.minClicks}</dd></>
                  )}
                  {typeof activeStrategyParams.rules.waste.maxConversions === "number" && (
                    <><dt style={{ color: "#6b7280" }}>waste.maxConversions</dt><dd>{activeStrategyParams.rules.waste.maxConversions}</dd></>
                  )}
                </>
              )}
              {activeStrategyParams.rules?.winners && (
                <>
                  {typeof activeStrategyParams.rules.winners.minRoas === "number" && (
                    <><dt style={{ color: "#6b7280" }}>winners.minRoas</dt><dd>{activeStrategyParams.rules.winners.minRoas}</dd></>
                  )}
                  {typeof activeStrategyParams.rules.winners.minConversions === "number" && (
                    <><dt style={{ color: "#6b7280" }}>winners.minConversions</dt><dd>{activeStrategyParams.rules.winners.minConversions}</dd></>
                  )}
                  {typeof activeStrategyParams.rules.winners.minCost === "number" && (
                    <><dt style={{ color: "#6b7280" }}>winners.minCost</dt><dd>{activeStrategyParams.rules.winners.minCost}</dd></>
                  )}
                </>
              )}
              {activeStrategyParams.scoring &&
                Object.entries(activeStrategyParams.scoring).map(([k, v]) =>
                  typeof v === "number" ? (
                    <React.Fragment key={k}><dt style={{ color: "#6b7280" }}>scoring.{k}</dt><dd>{v}</dd></React.Fragment>
                  ) : null
                )}
              {activeStrategyParams.reallocation?.enabled !== undefined && (
                <><dt style={{ color: "#6b7280" }}>reallocation.enabled</dt><dd>{String(activeStrategyParams.reallocation.enabled)}</dd></>
              )}
              {typeof activeStrategyParams.reallocation?.percentOfSpendToMove === "number" && (
                <><dt style={{ color: "#6b7280" }}>percentToMove</dt><dd>{activeStrategyParams.reallocation.percentOfSpendToMove}</dd></>
              )}
            </dl>
          </div>
        )}

        {/* Status block */}
        <div className={styles.section} style={{ marginBottom: "1rem", padding: "0.75rem" }}>
          {loadingEvaluate && <p>Loading evaluation…</p>}
          {error && <p style={{ color: "#b91c1c" }}>Error: {error}</p>}
          {result?.ok === false && result.noData && (
            <p style={{ color: "#b91c1c" }}>No CSV data available. Upload data in the Data tab.</p>
          )}
          {result?.ok && !result.noData && (
            <p style={{ color: "#166534" }}>
              Status: OK — {result.wasteSegments?.length ?? 0} waste, {result.winnerSegments?.length ?? 0} winners,{" "}
              {result.reallocationPlan?.length ?? 0} reallocation steps.
            </p>
          )}
          {result?.counts != null && (
            <p style={{ marginTop: "0.35rem", fontSize: "0.8125rem", color: "#374151" }}>
              Counts: signals={result.counts.signals}, byStateKeys={result.counts.byStateKeys}, byHourKeys={result.counts.byHourKeys}, byCampaignKeys={result.counts.byCampaignKeys}
            </p>
          )}
          {!result && !loadingEvaluate && !error && <p style={{ color: "#6b7280" }}>Status: No response yet. Select a CSV business and strategy.</p>}
        </div>

        {/* Raw JSON (collapsible, always present) */}
        <details style={{ marginBottom: "1rem" }}>
          <summary style={{ cursor: "pointer", fontSize: "0.875rem" }}>Raw JSON response</summary>
          <pre
            style={{
              marginTop: "0.5rem",
              padding: "0.75rem",
              background: "#f1f5f9",
              borderRadius: 6,
              fontSize: "0.75rem",
              overflow: "auto",
              maxHeight: 320,
            }}
          >
            {result != null ? JSON.stringify(result, null, 2) : "(no response yet)"}
          </pre>
        </details>

        {/* Waste Segments */}
        <section className={styles.section} aria-label="Waste segments">
          <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem" }}>Waste Segments</h3>
          {result?.wasteSegments && result.wasteSegments.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
              {result.wasteSegments.map((w, i) => (
                <li key={`${w.segmentType}-${w.key}-${i}`} style={{ marginBottom: "0.35rem" }}>
                  <strong>{w.segmentType}:{w.key}</strong> — score {w.score.toFixed(2)} — {w.reason}
                  {w.metrics && (
                    <span style={{ color: "#6b7280", fontSize: "0.8125rem" }}>
                      {" "}(cost {w.metrics.cost?.toFixed(0)}, ROAS {w.metrics.roas?.toFixed(2)})
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.emptyState}>(none)</p>
          )}
        </section>

        {/* Winner Segments */}
        <section className={styles.section} aria-label="Winner segments">
          <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem" }}>Winner Segments</h3>
          {result?.winnerSegments && result.winnerSegments.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
              {result.winnerSegments.map((w, i) => (
                <li key={`${w.segmentType}-${w.key}-${i}`} style={{ marginBottom: "0.35rem" }}>
                  <strong>{w.segmentType}:{w.key}</strong> — score {w.score.toFixed(2)} — {w.reason}
                  {w.metrics && (
                    <span style={{ color: "#6b7280", fontSize: "0.8125rem" }}>
                      {" "}(cost {w.metrics.cost?.toFixed(0)}, ROAS {w.metrics.roas?.toFixed(2)})
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.emptyState}>(none)</p>
          )}
        </section>

        {/* Reallocation Plan */}
        <section className={styles.section} aria-label="Reallocation plan">
          <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem" }}>Reallocation Plan</h3>
          {result?.reallocationPlan && result.reallocationPlan.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
              {result.reallocationPlan.map((r, i) => (
                <li key={i} style={{ marginBottom: "0.35rem" }}>
                  {r.from.segmentType}:{r.from.key} → {r.to.segmentType}:{r.to.key} — ${r.amount.toFixed(2)} — {r.reason}
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.emptyState}>(none)</p>
          )}
        </section>
      </section>
    </div>
  );
}
