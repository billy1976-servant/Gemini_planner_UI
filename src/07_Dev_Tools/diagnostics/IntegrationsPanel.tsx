/**
 * Integrations diagnostics panel — full system health: Sensors, Capabilities,
 * Exports, Bridges, System7, Action gating. Run Full Diagnostics + Export report.
 * Additive only; mirrors PipelineFlowPanel PASS/FAIL styling.
 */

"use client";

import React, { useState, useCallback } from "react";
import type { IntegrationStageResult } from "@/diagnostics/integrations/types";
import { runIntegrationTests } from "@/diagnostics/integrations/runIntegrationTests";

const BORDER = "1px solid #e5e7eb";
const PASS_BG = "#f0fdf4";
const PASS_BORDER = "#bbf7d0";
const FAIL_BG = "#fef2f2";
const FAIL_BORDER = "#fecaca";
const FAIL_TEXT = "#b91c1c";

function downloadReport(results: IntegrationStageResult[]) {
  const payload = {
    timestamp: new Date().toISOString(),
    environment: typeof window === "undefined" ? "ssr" : "browser",
    results,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `diagnostics-${payload.timestamp.replace(/[:.]/g, "-")}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function IntegrationsPanel() {
  const [results, setResults] = useState<IntegrationStageResult[] | null>(null);
  const [running, setRunning] = useState(false);

  const onRun = useCallback(async () => {
    setRunning(true);
    try {
      const next = await runIntegrationTests();
      setResults(next);
    } finally {
      setRunning(false);
    }
  }, []);

  const onExport = useCallback(() => {
    if (results == null || results.length === 0) return;
    downloadReport(results);
  }, [results]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        fontSize: 14,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 15, color: "#111" }}>
        Integrations
      </div>
      <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}>
        Full system health: Sensors, Capabilities, Exports, Bridges, System7,
        Action gating.
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={onRun}
          disabled={running}
          style={{
            padding: "8px 14px",
            fontSize: 13,
            fontWeight: 600,
            border: `1px solid #d1d5db`,
            borderRadius: 8,
            background: "#fff",
            color: "#374151",
            cursor: running ? "not-allowed" : "pointer",
          }}
        >
          {running ? "Running…" : "Run Full Diagnostics"}
        </button>
        {results != null && results.length > 0 && (
          <button
            type="button"
            onClick={onExport}
            style={{
              padding: "8px 14px",
              fontSize: 13,
              fontWeight: 600,
              border: `1px solid #d1d5db`,
              borderRadius: 8,
              background: "#f9fafb",
              color: "#374151",
              cursor: "pointer",
            }}
          >
            Export Diagnostics
          </button>
        )}
      </div>

      {results != null && results.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {results.map((r, i) => (
            <div
              key={`${r.stage}-${i}`}
              style={{
                border: r.status === "PASS" ? BORDER : `1px solid ${FAIL_BORDER}`,
                borderRadius: 8,
                overflow: "hidden",
                background: r.status === "PASS" ? "#fff" : FAIL_BG,
              }}
            >
              <div
                style={{
                  padding: "10px 12px",
                  fontWeight: 600,
                  fontSize: 14,
                  background: r.status === "PASS" ? "#f9fafb" : FAIL_BG,
                  borderBottom: BORDER,
                  color: r.status === "PASS" ? "#111" : FAIL_TEXT,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {r.status === "PASS" ? (
                  <span style={{ color: "#15803d" }} aria-hidden>✔</span>
                ) : (
                  <span style={{ color: FAIL_TEXT }} aria-hidden>✖</span>
                )}
                {r.stage}
                <span
                  style={{
                    marginLeft: "auto",
                    fontWeight: 700,
                    fontSize: 12,
                    color: r.status === "PASS" ? "#15803d" : FAIL_TEXT,
                  }}
                >
                  {r.status}
                </span>
              </div>
              <div
                style={{
                  padding: 12,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 12,
                      color: "#6b7280",
                      marginBottom: 4,
                    }}
                  >
                    EXPECTED
                  </div>
                  <div
                    style={{
                      fontFamily: "ui-monospace, monospace",
                      fontSize: 13,
                      color: "#374151",
                    }}
                  >
                    {r.expected}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 12,
                      color: "#6b7280",
                      marginBottom: 4,
                    }}
                  >
                    ACTUAL
                  </div>
                  <div
                    style={{
                      fontFamily: "ui-monospace, monospace",
                      fontSize: 13,
                      color: r.status === "PASS" ? "#374151" : FAIL_TEXT,
                      fontWeight: r.status === "PASS" ? 400 : 600,
                    }}
                  >
                    {r.actual}
                  </div>
                </div>
                {r.status === "FAIL" &&
                  r.substages != null &&
                  r.substages.length > 0 && (
                    <div>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 12,
                          color: "#6b7280",
                          marginBottom: 6,
                        }}
                      >
                        Breakdown
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 4,
                          fontSize: 12,
                          fontFamily: "ui-monospace, monospace",
                        }}
                      >
                        {r.substages.map((s, j) => (
                          <div
                            key={j}
                            style={{
                              color:
                                s.status === "PASS" ? "#15803d" : FAIL_TEXT,
                            }}
                          >
                            {s.label} → {s.status}
                            {s.detail != null ? ` (${s.detail})` : ""}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
