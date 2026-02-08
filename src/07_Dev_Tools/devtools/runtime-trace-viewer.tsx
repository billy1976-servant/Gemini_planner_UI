"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  getRuntimeDecisionLog,
  clearRuntimeDecisionLog,
  type RuntimeDecisionTrace,
} from "@/engine/devtools/runtime-decision-trace";

/**
 * Dev-only panel that reads window.__RUNTIME_DECISION_LOG__ and displays
 * Engine | Decision | Rule | Output | Time. Does not render in production.
 */
export function RuntimeTraceViewer() {
  const [entries, setEntries] = useState<RuntimeDecisionTrace[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setEntries(getRuntimeDecisionLog());
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 500);
    return () => clearInterval(interval);
  }, [refresh]);

  const handleClear = useCallback(() => {
    clearRuntimeDecisionLog();
    setEntries([]);
    setRefreshKey((k) => k + 1);
  }, []);

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const timeStr = (t: string | number) =>
    typeof t === "number" ? new Date(t).toISOString().slice(11, 23) : String(t).slice(11, 23);

  return (
    <div
      style={{
        fontFamily: "ui-monospace, monospace",
        fontSize: "12px",
        padding: "8px",
        background: "#1e1e1e",
        color: "#d4d4d4",
        borderRadius: "6px",
        maxHeight: "360px",
        overflow: "auto",
      }}
      data-runtime-trace-viewer
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <strong>Runtime Decision Trace</strong>
        <button
          type="button"
          onClick={handleClear}
          style={{
            padding: "4px 8px",
            cursor: "pointer",
            background: "#333",
            border: "1px solid #555",
            color: "#d4d4d4",
            borderRadius: "4px",
          }}
        >
          Clear
        </button>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #555", textAlign: "left" }}>
            <th style={{ padding: "4px 6px" }}>Engine</th>
            <th style={{ padding: "4px 6px" }}>Decision</th>
            <th style={{ padding: "4px 6px" }}>Rule</th>
            <th style={{ padding: "4px 6px" }}>Output</th>
            <th style={{ padding: "4px 6px" }}>Time</th>
          </tr>
        </thead>
        <tbody>
          {entries.length === 0 && (
            <tr>
              <td colSpan={5} style={{ padding: "8px", opacity: 0.7 }}>
                No entries. Trigger layout, behavior, or state to see traces.
              </td>
            </tr>
          )}
          {entries.map((e, i) => (
            <tr key={`${e.timestamp}-${i}`} style={{ borderBottom: "1px solid #333" }}>
              <td style={{ padding: "4px 6px", whiteSpace: "nowrap" }}>{e.engineId}</td>
              <td style={{ padding: "4px 6px" }}>{e.decisionType}</td>
              <td style={{ padding: "4px 6px" }}>
                {typeof e.ruleApplied === "string" ? e.ruleApplied : JSON.stringify(e.ruleApplied)}
              </td>
              <td style={{ padding: "4px 6px", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis" }}>
                {typeof e.decisionMade === "object" && e.decisionMade !== null
                  ? JSON.stringify(e.decisionMade)
                  : String(e.decisionMade)}
              </td>
              <td style={{ padding: "4px 6px", whiteSpace: "nowrap" }}>{timeStr(e.timestamp)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default RuntimeTraceViewer;
