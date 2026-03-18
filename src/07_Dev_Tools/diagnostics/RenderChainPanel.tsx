/**
 * Render Chain tab: Template used → Layout chosen → Molecule resolved → Atom resolved → DOM node created.
 */

"use client";

import React from "react";
import { useSyncExternalStore } from "react";
import { getState, subscribeState } from "@/state/state-store";
import { getPaletteName } from "@/engine/core/palette-store";
import { getLayout, subscribeLayout } from "@/engine/core/layout-store";

const BORDER = "1px solid #e5e7eb";

export default function RenderChainPanel() {
  const stateSnapshot = useSyncExternalStore(subscribeState, getState, getState);
  const layoutSnapshot = useSyncExternalStore(subscribeLayout, getLayout, getLayout);
  const paletteName = (stateSnapshot?.values?.paletteName ?? getPaletteName()) || "default";
  const templateId = (stateSnapshot?.values?.templateId ?? (layoutSnapshot as { templateId?: string })?.templateId) ?? "";
  const experience = (stateSnapshot?.values?.experience ?? "website") as string;

  const steps = [
    { label: "Template used", value: templateId ? templateId : `Experience: ${experience} (no template)` },
    { label: "Layout chosen", value: layoutSnapshot ? "From layout-store" : "—" },
    { label: "Molecule resolved", value: "From registry + JSON type" },
    { label: "Atom resolved", value: "Tokens from palette" },
    { label: "DOM node created", value: typeof document !== "undefined" && document.body ? "Mounted" : "—" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 14, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: "#111" }}>Render chain</div>
      <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}>
        Live stack: Template → Layout → Molecule → Atom → DOM
      </div>
      {steps.map((step, i) => (
        <div
          key={step.label}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 12px",
            border: BORDER,
            borderRadius: 8,
            background: "#fff",
          }}
        >
          {i > 0 && <span style={{ color: "#9ca3af", fontSize: 12 }}>→</span>}
          <span style={{ fontWeight: 600, minWidth: 140, color: "#374151" }}>{step.label}</span>
          <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 13, color: "#111" }}>{step.value}</span>
        </div>
      ))}
    </div>
  );
}
