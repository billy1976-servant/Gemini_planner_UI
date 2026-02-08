"use client";

import React, { useState, useCallback } from "react";
import { getAllScreenRefs, getScreenRefById, type ScreenRef } from "@/engine/core/safe-screen-registry";
import { safeImportJson } from "@/engine/core/safe-json-import";

type RowState = { status: "idle" | "pass" | "fail"; error?: string };

export default function ScreenDiagnostics() {
  const refs = getAllScreenRefs();
  const [selectedId, setSelectedId] = useState<string>(refs[0]?.id ?? "");
  const [rows, setRows] = useState<Record<string, RowState>>({});
  const [runningAll, setRunningAll] = useState(false);

  const runOne = useCallback(async (ref: ScreenRef): Promise<RowState> => {
    if (ref.kind === "json") {
      const result = await safeImportJson(ref.path);
      if (result.ok) return { status: "pass" };
      return { status: "fail", error: (result as { ok: false; error: string }).error };
    }
    if (ref.kind === "tsx") {
      return { status: ref.component ? "pass" : "fail", error: ref.component ? undefined : "Component missing" };
    }
    return { status: "idle" };
  }, []);

  const runSelected = useCallback(async () => {
    const ref = getScreenRefById(selectedId);
    if (!ref) return;
    const state = await runOne(ref);
    setRows((prev) => ({ ...prev, [selectedId]: state }));
  }, [selectedId, runOne]);

  const runAll = useCallback(async () => {
    setRunningAll(true);
    const next: Record<string, RowState> = {};
    for (const ref of refs) {
      next[ref.id] = await runOne(ref);
    }
    setRows(next);
    setRunningAll(false);
  }, [refs, runOne]);

  const selectedRef = getScreenRefById(selectedId);
  const selectedState = selectedRef ? rows[selectedId] : undefined;
  const previewPath =
    selectedRef?.kind === "json"
      ? (selectedRef as { path: string }).path.replace(/\.json$/i, "")
      : selectedRef?.kind === "tsx"
        ? `tsx:tsx-screens/diagnostics/ScreenDiagnostics`
        : "";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "#e2e8f0",
        padding: 24,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>Screen diagnostics</h1>
      <p style={{ color: "#94a3b8", marginBottom: 24 }}>
        All known screens; PASS = loadable, FAIL = missing or invalid. No static imports — safe for build.
      </p>

      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span>Screen:</span>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            style={{
              padding: "8px 12px",
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: 8,
              color: "#e2e8f0",
              minWidth: 280,
            }}
          >
            {refs.map((r) => (
              <option key={r.id} value={r.id}>
                {r.id} ({r.kind})
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={runSelected}
          style={{
            padding: "8px 16px",
            background: "#334155",
            border: "1px solid #475569",
            borderRadius: 8,
            color: "#e2e8f0",
            cursor: "pointer",
          }}
        >
          Reload selected
        </button>
        <button
          type="button"
          onClick={runAll}
          disabled={runningAll}
          style={{
            padding: "8px 16px",
            background: "#334155",
            border: "1px solid #475569",
            borderRadius: 8,
            color: "#e2e8f0",
            cursor: runningAll ? "wait" : "pointer",
          }}
        >
          {runningAll ? "Running…" : "Run all"}
        </button>
      </div>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          background: "#1e293b",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        <thead>
          <tr style={{ borderBottom: "1px solid #334155" }}>
            <th style={{ textAlign: "left", padding: 12 }}>id</th>
            <th style={{ textAlign: "left", padding: 12 }}>kind</th>
            <th style={{ textAlign: "left", padding: 12 }}>path</th>
            <th style={{ textAlign: "left", padding: 12 }}>status</th>
            <th style={{ textAlign: "left", padding: 12 }}>error</th>
          </tr>
        </thead>
        <tbody>
          {refs.map((r) => {
            const state = rows[r.id];
            const path = r.kind === "json" ? (r as { path: string }).path : "—";
            return (
              <tr key={r.id} style={{ borderBottom: "1px solid #334155" }}>
                <td style={{ padding: 12 }}>{r.id}</td>
                <td style={{ padding: 12 }}>{r.kind}</td>
                <td style={{ padding: 12 }}>{path}</td>
                <td style={{ padding: 12 }}>
                  {state?.status === "pass" && <span style={{ color: "#22c55e" }}>PASS</span>}
                  {state?.status === "fail" && <span style={{ color: "#ef4444" }}>FAIL</span>}
                  {(!state || state.status === "idle") && <span style={{ color: "#94a3b8" }}>—</span>}
                </td>
                <td style={{ padding: 12, maxWidth: 400, overflow: "hidden", textOverflow: "ellipsis" }}>
                  {state?.error ?? "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {selectedRef && (
        <div style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>Selected: {selectedId}</h2>
          {selectedState?.status === "pass" && selectedRef.kind === "json" && (
            <a
              href={`/?screen=${(selectedRef as { path: string }).path.replace(/\.json$/i, "")}`}
              style={{ color: "#38bdf8" }}
            >
              Preview screen
            </a>
          )}
          {selectedState?.status === "fail" && (
            <div style={{ color: "#f87171", marginTop: 8 }}>
              <div>Suggested fix: ensure the file exists at <code style={{ background: "#334155", padding: "2px 6px", borderRadius: 4 }}>src/apps-json/apps/{(selectedRef as { path: string }).path}</code> or fix path/rename in registry.</div>
              {selectedState.error && <div style={{ marginTop: 4 }}>Error: {selectedState.error}</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
