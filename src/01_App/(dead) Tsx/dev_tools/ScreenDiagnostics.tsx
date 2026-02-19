"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { getAllScreenRefs, getScreenRefById, type ScreenRef } from "@/engine/core/safe-screen-registry";
import { safeImportJson } from "@/engine/core/safe-json-import";
import {
  classifyError,
  getFixHint,
  type ErrorType,
} from "@/engine/core/diagnostics/error-classifier";

/* -------------------------------------------------------------------------
   TSX discovery — same pattern as page.tsx; diagnostics-only, no engine change.
   Context from this file: src/apps-tsx/tsx-screens/diagnostics/ → root = ../..
------------------------------------------------------------------------- */
const tsxContext = typeof require !== "undefined" ? (require as any).context("../..", true, /\.tsx$/) : null;
const TSX_KEYS: string[] = tsxContext ? tsxContext.keys() : [];

function normalizeTsxKey(key: string): string {
  return key.replace(/^\.\//, "").replace(/\.tsx$/, "");
}

/** One row in the diagnostics table (identity only; result is separate). */
type DiagRow = { id: string; kind: "json" | "tsx"; path: string };

/** Per-row result from running checks. */
type RowResult = {
  exists: boolean;
  loadable: boolean;
  importable: boolean;
  jsonValid: boolean;
  errorType: ErrorType;
  fixHint: string;
  status: "PASS" | "FAIL";
  error?: string;
};

/** Structural drift warning. */
type DriftWarning = { id: string; message: string };

const TABLE_STYLE = {
  width: "100%" as const,
  borderCollapse: "collapse" as const,
  background: "#1e293b",
  borderRadius: 8,
  overflow: "hidden" as const,
};
const TH_STYLE = { textAlign: "left" as const, padding: 12 };
const TD_STYLE = { padding: 12 };

export default function ScreenDiagnostics() {
  const registryRefs = getAllScreenRefs();

  const rows: DiagRow[] = useMemo(() => {
    const list: DiagRow[] = [];
    for (const r of registryRefs) {
      if (r.kind === "json") {
        list.push({ id: r.id, kind: "json", path: (r as { path: string }).path });
      }
      if (r.kind === "tsx") {
        const path = r.id.replace(/^tsx:/, "");
        list.push({ id: r.id, kind: "tsx", path });
      }
    }
    for (const key of TSX_KEYS) {
      const path = normalizeTsxKey(key);
      const id = `tsx:${path}`;
      if (!list.some((r) => r.id === id)) {
        list.push({ id, kind: "tsx", path });
      }
    }
    return list;
  }, [registryRefs]);

  const [results, setResults] = useState<Record<string, RowResult>>({});
  const [runningAll, setRunningAll] = useState(false);
  const [selectedId, setSelectedId] = useState<string>(rows[0]?.id ?? "");
  const [showFilter, setShowFilter] = useState<"all" | "pass" | "fail">("all");
  const [kindFilter, setKindFilter] = useState<"json" | "tsx" | "both">("both");
  const [driftWarnings, setDriftWarnings] = useState<DriftWarning[]>([]);
  const [compact, setCompact] = useState(true);

  const runOneJson = useCallback(async (path: string): Promise<RowResult> => {
    const res = await safeImportJson(path);
    if (res.ok) {
      const jsonValid = res.json != null && typeof res.json === "object";
      return {
        exists: true,
        loadable: true,
        importable: true,
        jsonValid,
        errorType: jsonValid ? "UNKNOWN" : "JSON_PARSE_ERROR",
        fixHint: jsonValid ? "" : getFixHint("JSON_PARSE_ERROR"),
        status: jsonValid ? "PASS" : "FAIL",
      };
    }
    if (!res.ok) {
      const err = (res as { ok: false; error: string }).error;
      const errorType = classifyError(err);
      return {
        exists: !err?.includes("404") && errorType !== "PATH_MISSING",
        loadable: false,
        importable: true,
        jsonValid: false,
        errorType,
        fixHint: getFixHint(errorType),
        status: "FAIL",
        error: err,
      };
    }
    return { exists: false, loadable: false, importable: false, jsonValid: false, errorType: "UNKNOWN", fixHint: "", status: "FAIL" };
  }, []);

  const runOneTsx = useCallback(async (path: string): Promise<RowResult> => {
    const exists = TSX_KEYS.some((k) => normalizeTsxKey(k) === path);
    try {
      const mod = await import(`@/apps-tsx/${path}`);
      const loadable = !!mod?.default;
      return {
        exists,
        loadable,
        importable: loadable,
        jsonValid: true,
        errorType: "UNKNOWN",
        fixHint: "",
        status: loadable ? "PASS" : "FAIL",
        error: loadable ? undefined : "No default export",
      };
    } catch (e: any) {
      const errMsg = e?.message ?? String(e);
      const errorType = classifyError(errMsg);
      return {
        exists,
        loadable: false,
        importable: false,
        jsonValid: true,
        errorType: errorType === "UNKNOWN" ? "RUNTIME_IMPORT_ERROR" : errorType,
        fixHint: getFixHint(errorType === "UNKNOWN" ? "RUNTIME_IMPORT_ERROR" : errorType),
        status: "FAIL",
        error: errMsg,
      };
    }
  }, []);

  const runOne = useCallback(
    async (row: DiagRow): Promise<RowResult> => {
      if (row.kind === "json") return runOneJson(row.path);
      return runOneTsx(row.path);
    },
    [runOneJson, runOneTsx]
  );

  const runAll = useCallback(async () => {
    setRunningAll(true);
    const next: Record<string, RowResult> = {};
    for (const row of rows) {
      next[row.id] = await runOne(row);
    }
    setResults(next);
    setRunningAll(false);
  }, [rows, runOne]);

  const runSelected = useCallback(async () => {
    const row = rows.find((r) => r.id === selectedId);
    if (!row) return;
    const result = await runOne(row);
    setResults((prev) => ({ ...prev, [selectedId]: result }));
  }, [selectedId, rows, runOne]);

  useEffect(() => {
    const warnings: DriftWarning[] = [];
    if (TSX_KEYS.length === 0) {
      warnings.push({
        id: "tsx-missing",
        message: "src/apps-tsx folder missing or no .tsx files discovered (require.context empty).",
      });
    }
    fetch("/api/screens", { cache: "no-store" })
      .then((res) => {
        if (!res.ok) {
          warnings.push({
            id: "api-screens",
            message: `GET /api/screens returned ${res.status}. Check src/apps-json and API route.`,
          });
        }
        return res.json();
      })
      .then((data) => {
        const hasJson = Array.isArray(data) && data.some((c: any) => c.category && !String(c.category).startsWith("tsx:"));
        const hasTsx = Array.isArray(data) && data.some((c: any) => String(c.category).startsWith("tsx:"));
        if (Array.isArray(data) && data.length === 0) {
          warnings.push({
            id: "no-categories",
            message: "No screen categories returned. Check apps-json and apps-tsx folder structure.",
          });
        }
        if (Array.isArray(data) && data.length > 0 && !hasJson) {
          warnings.push({
            id: "no-json-category",
            message: "tsconfig alias @/apps-json or require.context root may not match physical folder.",
          });
        }
        if (Array.isArray(data) && data.length > 0 && !hasTsx && TSX_KEYS.length > 0) {
          warnings.push({
            id: "tsx-api-mismatch",
            message: "Dynamic import root may not match alias @/apps-tsx.",
          });
        }
        setDriftWarnings((prev) => {
          const byId = new Map(prev.map((w) => [w.id, w]));
          warnings.forEach((w) => byId.set(w.id, w));
          return Array.from(byId.values());
        });
      })
      .catch(() => {
        setDriftWarnings((prev) => [
          ...prev.filter((w) => w.id !== "api-screens"),
          { id: "api-screens", message: "Failed to fetch /api/screens. Check network and API route." },
        ]);
      });
  }, []);

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (kindFilter !== "both" && r.kind !== kindFilter) return false;
      const res = results[r.id];
      if (showFilter === "all") return true;
      const status = res?.status ?? null;
      if (showFilter === "pass") return status === "PASS";
      if (showFilter === "fail") return status === "FAIL";
      return true;
    });
  }, [rows, results, showFilter, kindFilter]);

  const health = useMemo(() => {
    const total = rows.length;
    let pass = 0;
    let fail = 0;
    for (const r of rows) {
      const s = results[r.id]?.status;
      if (s === "PASS") pass++;
      else if (s === "FAIL") fail++;
    }
    const pct = total ? Math.round((pass / total) * 100) : 100;
    let band: "green" | "yellow" | "red" = "green";
    if (pct < 70) band = "red";
    else if (pct < 90) band = "yellow";
    return { total, pass, fail, pct, band };
  }, [rows, results]);

  const selectedRef = getScreenRefById(selectedId) ?? rows.find((r) => r.id === selectedId);
  const selectedResult = results[selectedId];

  return (
    <div
      className={compact ? "diagnostics-compact" : ""}
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "#e2e8f0",
        padding: 24,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>Screen diagnostics</h1>
      <p style={{ color: "#94a3b8", marginBottom: 24 }}>
        Structural stability scanner. PASS = exists, loadable, valid JSON or importable TSX. No changes to engines or runtime.
      </p>

      {/* Phase 5 — Global Health Score */}
      <div
        style={{
          display: "flex",
          gap: 24,
          marginBottom: 24,
          padding: 16,
          background: "#1e293b",
          borderRadius: 8,
          border: `2px solid ${health.band === "green" ? "#22c55e" : health.band === "yellow" ? "#eab308" : "#ef4444"}`,
        }}
      >
        <span>Total scanned: <strong>{health.total}</strong></span>
        <span>PASS: <strong style={{ color: "#22c55e" }}>{health.pass}</strong></span>
        <span>FAIL: <strong style={{ color: "#ef4444" }}>{health.fail}</strong></span>
        <span>% healthy: <strong style={{ color: health.band === "green" ? "#22c55e" : health.band === "yellow" ? "#eab308" : "#ef4444" }}>{health.pct}%</strong></span>
        <span style={{ color: "#64748b" }}>(90–100% green, 70–89% yellow, &lt;70% red)</span>
      </div>

      {/* Phase 4 — Structural drift panel */}
      {driftWarnings.length > 0 && (
        <div
          style={{
            marginBottom: 24,
            padding: 12,
            background: "#431407",
            border: "1px solid #9a3412",
            borderRadius: 8,
            color: "#fecaca",
          }}
        >
          <strong>Structural drift / environment</strong>
          <ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>
            {driftWarnings.map((w) => (
              <li key={w.id}>{w.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Phase 6 — Quick filters + Run controls */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span>Show:</span>
          <select
            value={showFilter}
            onChange={(e) => setShowFilter(e.target.value as "all" | "pass" | "fail")}
            style={{ padding: "8px 12px", background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }}
          >
            <option value="all">All</option>
            <option value="pass">PASS</option>
            <option value="fail">FAIL</option>
          </select>
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span>Kind:</span>
          <select
            value={kindFilter}
            onChange={(e) => setKindFilter(e.target.value as "json" | "tsx" | "both")}
            style={{ padding: "8px 12px", background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }}
          >
            <option value="both">Both</option>
            <option value="json">JSON</option>
            <option value="tsx">TSX</option>
          </select>
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span>Screen:</span>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            style={{ padding: "8px 12px", background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0", minWidth: 280 }}
          >
            {rows.map((r) => (
              <option key={r.id} value={r.id}>
                {r.id} ({r.kind})
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={runSelected}
          style={{ padding: "8px 16px", background: "#334155", border: "1px solid #475569", borderRadius: 8, color: "#e2e8f0", cursor: "pointer" }}
        >
          Reload selected
        </button>
        <button
          type="button"
          onClick={runAll}
          disabled={runningAll}
          style={{ padding: "8px 16px", background: "#334155", border: "1px solid #475569", borderRadius: 8, color: "#e2e8f0", cursor: runningAll ? "wait" : "pointer" }}
        >
          {runningAll ? "Running…" : "Run all"}
        </button>
        <button type="button" onClick={() => setCompact(!compact)}>
          Density
        </button>
      </div>

      {/* Phase 1 — Expanded table */}
      <div style={{ maxHeight: "70vh", overflowY: "auto" }}>
      <table style={TABLE_STYLE}>
        <thead>
          <tr style={{ borderBottom: "1px solid #334155" }}>
            <th style={TH_STYLE}>id</th>
            <th style={TH_STYLE}>kind</th>
            <th style={TH_STYLE}>path</th>
            <th style={TH_STYLE}>exists</th>
            <th style={TH_STYLE}>loadable</th>
            <th style={TH_STYLE}>importable</th>
            <th style={TH_STYLE}>jsonValid</th>
            <th style={TH_STYLE}>errorType</th>
            <th style={TH_STYLE}>fixHint</th>
            <th style={TH_STYLE}>status</th>
          </tr>
        </thead>
        <tbody>
          {filteredRows.map((r) => {
            const res = results[r.id];
            return (
              <tr key={r.id} style={{ borderBottom: "1px solid #334155" }}>
                <td style={TD_STYLE}>{r.id}</td>
                <td style={TD_STYLE}>{r.kind}</td>
                <td style={TD_STYLE}>{r.path}</td>
                <td style={TD_STYLE}>{res ? String(res.exists) : "—"}</td>
                <td style={TD_STYLE}>{res ? String(res.loadable) : "—"}</td>
                <td style={TD_STYLE}>{res ? String(res.importable) : "—"}</td>
                <td style={TD_STYLE}>{res ? String(res.jsonValid) : "—"}</td>
                <td style={TD_STYLE}>{res?.errorType ?? "—"}</td>
                <td style={{ ...TD_STYLE, maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis" }} title={res?.fixHint}>
                  {res?.fixHint ?? "—"}
                </td>
                <td style={TD_STYLE}>
                  {res?.status === "PASS" && <span style={{ color: "#22c55e" }}>PASS</span>}
                  {res?.status === "FAIL" && <span style={{ color: "#ef4444" }}>FAIL</span>}
                  {!res && <span style={{ color: "#94a3b8" }}>—</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>

      {/* Selected row detail + preview */}
      {selectedRef && (
        <div style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>Selected: {selectedId}</h2>
          {selectedResult?.status === "PASS" && (selectedRef as DiagRow).kind === "json" && (
            <a
              href={`/?screen=${(selectedRef as { path?: string }).path?.replace(/\.json$/i, "") ?? selectedId}`}
              style={{ color: "#38bdf8" }}
            >
              Preview screen
            </a>
          )}
          {selectedResult?.status === "FAIL" && (
            <div style={{ color: "#f87171", marginTop: 8 }}>
              <div><strong>Fix:</strong> {selectedResult.fixHint}</div>
              {selectedResult.error && <div style={{ marginTop: 4 }}>Error: {selectedResult.error}</div>}
              {(selectedRef as DiagRow).kind === "json" && (
                <div style={{ marginTop: 4 }}>
                  Expected path: <code style={{ background: "#334155", padding: "2px 6px", borderRadius: 4 }}>src/apps-json/apps/{(selectedRef as { path?: string }).path ?? (selectedRef as DiagRow).path}</code>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
