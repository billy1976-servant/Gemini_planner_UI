"use client";

import React from "react";
import { useSyncExternalStore } from "react";
import { getState, subscribeState } from "@/state/state-store";

export interface DiagnosticsValueViewerProps {
  stateKey?: string;
  params?: { stateKey?: string };
}

/**
 * Read-only viewer for state.values[stateKey]. Renders JSON pretty-printed or "No result yet".
 * Used by diagnostics screen only. No layout or engine changes.
 */
export default function DiagnosticsValueViewer({
  stateKey: stateKeyProp,
  params,
}: DiagnosticsValueViewerProps) {
  const stateKey = stateKeyProp ?? params?.stateKey ?? "";

  const state = useSyncExternalStore(
    subscribeState,
    getState,
    getState
  );

  const value =
    typeof stateKey === "string" && stateKey.length > 0
      ? state?.values?.[stateKey]
      : undefined;

  if (value === undefined) {
    return (
      <div style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic", padding: "8px 0" }}>
        No result yet
      </div>
    );
  }

  return (
    <pre
      style={{
        margin: 0,
        padding: 12,
        background: "#1e293b",
        color: "#e2e8f0",
        borderRadius: 8,
        fontSize: 12,
        overflow: "auto",
        maxHeight: 280,
      }}
    >
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}
