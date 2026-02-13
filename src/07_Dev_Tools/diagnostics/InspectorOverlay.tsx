/**
 * Inspector overlay: when Inspect Mode is on, shows highlight on hover/click
 * and a right-side panel with element identity, computed styles, full trace.
 * Copy Trace / Copy Computed Styles / Clear.
 */

"use client";

import React, { useEffect, useState } from "react";
import { getTraceByElementId, setComputedForElement, clear, type TraceRecord } from "./traceStore";
import { getTokenTraceView, setTokenTraceView, subscribe } from "./inspectorStore";

const COMPUTED_KEYS = [
  "fontSize", "fontWeight", "lineHeight", "letterSpacing", "color", "backgroundColor",
  "padding", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
  "gap", "borderRadius", "boxShadow", "width", "height", "objectFit",
];

function stepOutPreview(out: unknown): string {
  if (out === undefined) return "undefined";
  if (out === null) return "null";
  if (typeof out === "object") return JSON.stringify(out).slice(0, 80) + (JSON.stringify(out).length > 80 ? "…" : "");
  return String(out);
}

export type InspectorOverlayProps = {
  enabled: boolean;
  hoveredId: string | null;
  pinnedId: string | null;
  onPin: (id: string | null) => void;
  onClear: () => void;
};

export default function InspectorOverlay({
  enabled,
  hoveredId,
  pinnedId,
  onPin,
  onClear,
}: InspectorOverlayProps) {
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [trace, setTrace] = useState<TraceRecord | undefined>(undefined);
  const [computedStyles, setComputedStyles] = useState<Record<string, string>>({});
  const tokenTraceView = React.useSyncExternalStore(subscribe, getTokenTraceView, getTokenTraceView);

  const activeId = pinnedId ?? hoveredId;

  useEffect(() => {
    if (!enabled || !activeId) {
      setHighlightRect(null);
      setTrace(undefined);
      setComputedStyles({});
      return;
    }
    const el = document.querySelector(`[data-hi-id="${activeId}"]`);
    if (!el || !(el instanceof HTMLElement)) {
      setHighlightRect(null);
      setTrace(undefined);
      return;
    }
    setHighlightRect(el.getBoundingClientRect());
    setTrace(getTraceByElementId(activeId));
    const computed: Record<string, string> = {};
    const s = getComputedStyle(el);
    for (const key of COMPUTED_KEYS) {
      const v = (s as any)[key];
      if (v != null && v !== "") computed[key] = String(v);
    }
    setComputedStyles(computed);
    setComputedForElement(activeId, computed);
  }, [enabled, activeId]);

  // Update highlight rect on scroll/resize when element is pinned or hovered
  useEffect(() => {
    if (!enabled || !activeId) return;
    const el = document.querySelector(`[data-hi-id="${activeId}"]`);
    if (!el) return;
    const update = () => setHighlightRect((el as HTMLElement).getBoundingClientRect());
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [enabled, activeId]);

  if (!enabled) return null;

  const handleCopyTrace = () => {
    if (!trace) return;
    const payload = {
      ts: trace.ts,
      scope: trace.scope,
      elementId: trace.elementId,
      screenPath: trace.screenPath,
      molecule: trace.molecule,
      prop: trace.prop,
      tokenPath: trace.tokenPath,
      steps: trace.steps,
      status: trace.status,
      error: trace.error,
      computedStyles: trace.computedStyles ?? computedStyles,
    };
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
  };

  const handleCopyComputed = () => {
    navigator.clipboard.writeText(JSON.stringify(computedStyles, null, 2));
  };

  const firstFail = trace?.error != null && trace.steps[trace.error.stepIndex];

  return (
    <>
      {/* Highlight outline */}
      {highlightRect && (
        <div
          style={{
            position: "fixed",
            left: highlightRect.left,
            top: highlightRect.top,
            width: highlightRect.width,
            height: highlightRect.height,
            pointerEvents: "none",
            boxSizing: "border-box",
            border: "1px solid rgba(59, 130, 246, 0.8)",
            borderRadius: 2,
            zIndex: 9998,
          }}
        />
      )}

      {/* Right panel */}
      <div
        style={{
          position: "fixed",
          right: 0,
          top: 56,
          bottom: 0,
          width: 320,
          maxWidth: "90vw",
          background: "#fff",
          borderLeft: "1px solid #e5e7eb",
          boxShadow: "-2px 0 8px rgba(0,0,0,0.06)",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          fontSize: 12,
        }}
      >
        <div style={{ padding: "10px 12px", borderBottom: "1px solid #e5e7eb", display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={handleCopyTrace}
            disabled={!trace}
            style={{ padding: "4px 8px", fontSize: 11, borderRadius: 6, border: "1px solid #d1d5db", background: "#f9fafb", cursor: trace ? "pointer" : "not-allowed" }}
          >
            Copy Trace
          </button>
          <button
            type="button"
            onClick={handleCopyComputed}
            disabled={Object.keys(computedStyles).length === 0}
            style={{ padding: "4px 8px", fontSize: 11, borderRadius: 6, border: "1px solid #d1d5db", background: "#f9fafb", cursor: Object.keys(computedStyles).length ? "pointer" : "not-allowed" }}
          >
            Copy Computed
          </button>
          <button
            type="button"
            onClick={() => { onClear(); clear(); onPin(null); }}
            style={{ padding: "4px 8px", fontSize: 11, borderRadius: 6, border: "1px solid #d1d5db", background: "#fef2f2", color: "#b91c1c", cursor: "pointer" }}
          >
            Clear
          </button>
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: 12 }}>
          {tokenTraceView && (
            <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: "1px solid #e5e7eb" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontWeight: 600, color: "#111" }}>Token: {tokenTraceView.keyPath}</span>
                <button type="button" onClick={() => setTokenTraceView(null)} style={{ padding: "2px 6px", fontSize: 10, borderRadius: 4, border: "1px solid #d1d5db", background: "#f9fafb", cursor: "pointer" }}>Clear</button>
              </div>
              <div style={{ fontSize: 11, color: "#374151", marginBottom: 4 }}>
                resolved: {typeof tokenTraceView.resolved === "object" ? JSON.stringify(tokenTraceView.resolved).slice(0, 60) + "…" : String(tokenTraceView.resolved)} · {tokenTraceView.pass ? "✅ pass" : "❌ fail"}
              </div>
              <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10 }}>
                {tokenTraceView.steps.map((s, i) => (
                  <div key={i} style={{ padding: "2px 0", color: "#374151" }}>
                    {s.label}: in={stepOutPreview(s.in)} → out={stepOutPreview(s.out)}
                  </div>
                ))}
              </div>
            </div>
          )}
          {!activeId && !tokenTraceView && (
            <div style={{ color: "#6b7280", fontSize: 11 }}>Hover or click an element in the preview to inspect.</div>
          )}
          {activeId && (
            <>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontWeight: 600, color: "#111", marginBottom: 4 }}>Element</div>
                <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, color: "#374151" }}>
                  <div>molecule: {trace?.molecule ?? "—"}</div>
                  <div>id: {activeId}</div>
                  <div>path: {trace?.screenPath ?? "—"}</div>
                </div>
              </div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontWeight: 600, color: "#111", marginBottom: 4 }}>Computed</div>
                <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, color: "#374151" }}>
                  {Object.entries(computedStyles).map(([k, v]) => (
                    <div key={k}>{k}: {v}</div>
                  ))}
                  {Object.keys(computedStyles).length === 0 && <div style={{ color: "#9ca3af" }}>—</div>}
                </div>
              </div>
              {trace && trace.steps.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontWeight: 600, color: "#111", marginBottom: 4 }}>Trace</div>
                  {trace.status === "fail" && firstFail && (
                    <div
                      style={{
                        padding: "6px 8px",
                        marginBottom: 8,
                        borderRadius: 6,
                        background: "#fef2f2",
                        color: "#b91c1c",
                        border: "1px solid #fecaca",
                        fontSize: 11,
                      }}
                    >
                      FAIL at step: {firstFail.label} — output was {stepOutPreview(firstFail.out)}
                    </div>
                  )}
                  <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10 }}>
                    {trace.steps.map((s, i) => (
                      <div
                        key={i}
                        style={{
                          padding: "2px 0",
                          color: trace.error?.stepIndex === i ? "#b91c1c" : "#374151",
                        }}
                      >
                        {trace.error?.stepIndex === i ? "❌ " : "✅ "}
                        {s.label}: in={stepOutPreview(s.in)} → out={stepOutPreview(s.out)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
