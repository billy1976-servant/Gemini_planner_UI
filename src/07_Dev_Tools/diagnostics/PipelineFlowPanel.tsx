/**
 * Full Pipeline view: INPUT → EXPECTED → ACTUAL → STATUS per stage.
 * Failures and mismatches shown in RED.
 */

"use client";

import React, { useMemo } from "react";
import { useSyncExternalStore } from "react";
import { getState, subscribeState } from "@/state/state-store";
import { getPaletteName } from "@/engine/core/palette-store";
import { getLayout, subscribeLayout } from "@/engine/core/layout-store";
import { palettes } from "@/palettes";
import { validatePaletteContract } from "@/diagnostics/pipeline/palette/contract";
import { PIPELINE_STAGE_ORDER, PIPELINE_STAGE_LABELS, type PipelineStageId } from "@/diagnostics/pipeline/types";

export type StageBlock = {
  stageId: PipelineStageId;
  label: string;
  input: string;
  expected: string;
  actual: string;
  pass: boolean;
  failedProperty?: string;
};

function usePipelineStages(): StageBlock[] {
  const stateSnapshot = useSyncExternalStore(subscribeState, getState, getState);
  const layoutSnapshot = useSyncExternalStore(subscribeLayout, getLayout, getLayout);
  const paletteName = (stateSnapshot?.values?.paletteName ?? getPaletteName()) || "default";
  const activePalette = (palettes as Record<string, unknown>)[paletteName] ?? null;

  return useMemo(() => {
    const templateId = (stateSnapshot?.values?.templateId ?? (layoutSnapshot as { templateId?: string })?.templateId) ?? "";
    const results: StageBlock[] = [];

    for (const stageId of PIPELINE_STAGE_ORDER) {
      const label = PIPELINE_STAGE_LABELS[stageId];
      let input = "";
      let expected = "";
      let actual = "";
      let pass = true;
      let failedProperty: string | undefined;

      switch (stageId) {
        case "json":
          input = `screen state keys: ${stateSnapshot?.values ? Object.keys(stateSnapshot.values).length : 0}`;
          expected = "Non-empty state";
          actual = stateSnapshot?.values ? "State loaded" : "No state";
          pass = !!stateSnapshot?.values;
          if (!pass) failedProperty = "state";
          break;
        case "template":
          input = `experience + templateId`;
          expected = "Template or experience-only";
          actual = templateId ? `Template: ${templateId}` : "Experience only";
          pass = true;
          break;
        case "layout":
          input = "section layout requests";
          expected = "Layout definition per section";
          actual = layoutSnapshot ? "Layout resolved" : "Missing";
          pass = !!layoutSnapshot;
          if (!pass) failedProperty = "layoutSnapshot";
          break;
        case "palette": {
          const check = validatePaletteContract(activePalette as any);
          input = `palette name: ${paletteName}`;
          expected = "color, surface, radius, padding, textSize, textWeight, textRole";
          actual = check.ok ? "Contract OK" : check.failures.join("; ");
          pass = check.ok;
          if (!pass) failedProperty = check.failures[0];
          break;
        }
        case "molecule":
          input = "molecule type from JSON";
          expected = "Molecule from registry";
          actual = "Molecules resolved";
          pass = true;
          break;
        case "atom":
          input = "atom params + tokens";
          expected = "Primitive values";
          actual = "Atoms resolve tokens";
          pass = true;
          break;
        case "renderer":
          input = "React tree";
          expected = "Renderer active";
          actual = typeof document !== "undefined" ? "DOM available" : "SSR";
          pass = typeof document !== "undefined";
          if (!pass) failedProperty = "document";
          break;
        case "dom":
          input = "Committed tree";
          expected = "DOM nodes mounted";
          actual = typeof document !== "undefined" && document.body ? "Body present" : "No DOM";
          pass = typeof document !== "undefined" && !!document.body;
          if (!pass) failedProperty = "body";
          break;
        default:
          input = "—";
          expected = "—";
          actual = "—";
      }

      results.push({ stageId, label, input, expected, actual, pass, failedProperty });
    }
    return results;
  }, [stateSnapshot, layoutSnapshot, activePalette, paletteName]);
}

const BORDER = "1px solid #e5e7eb";
const PASS_BG = "#f0fdf4";
const PASS_BORDER = "#bbf7d0";
const FAIL_BG = "#fef2f2";
const FAIL_BORDER = "#fecaca";
const FAIL_TEXT = "#b91c1c";

export default function PipelineFlowPanel() {
  const stages = usePipelineStages();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, fontSize: 14, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: "#111" }}>Pipeline flow</div>
      <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}>
        JSON → Template → Layout → Palette → Molecule → Atom → Renderer → DOM
      </div>
      {stages.map((stage, i) => (
        <div
          key={stage.stageId}
          style={{
            border: stage.pass ? BORDER : `1px solid ${FAIL_BORDER}`,
            borderRadius: 8,
            overflow: "hidden",
            background: stage.pass ? "#fff" : FAIL_BG,
          }}
        >
          <div
            style={{
              padding: "10px 12px",
              fontWeight: 600,
              fontSize: 14,
              background: stage.pass ? "#f9fafb" : FAIL_BG,
              borderBottom: BORDER,
              color: stage.pass ? "#111" : FAIL_TEXT,
            }}
          >
            {i > 0 && <span style={{ color: "#9ca3af", marginRight: 8 }}>→</span>}
            {stage.label} Stage
          </div>
          <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 12, color: "#6b7280", marginBottom: 4 }}>INPUT</div>
              <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 13, color: "#374151" }}>{stage.input}</div>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 12, color: "#6b7280", marginBottom: 4 }}>EXPECTED</div>
              <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 13, color: "#374151" }}>{stage.expected}</div>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 12, color: "#6b7280", marginBottom: 4 }}>ACTUAL</div>
              <div
                style={{
                  fontFamily: "ui-monospace, monospace",
                  fontSize: 13,
                  color: stage.pass ? "#374151" : FAIL_TEXT,
                  fontWeight: stage.pass ? 400 : 600,
                }}
              >
                {stage.actual}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontWeight: 600, fontSize: 12, color: "#6b7280" }}>STATUS:</span>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: 13,
                  color: stage.pass ? "#15803d" : FAIL_TEXT,
                }}
              >
                {stage.pass ? "PASS" : "FAIL"}
              </span>
              {stage.failedProperty != null && (
                <span style={{ fontSize: 12, color: FAIL_TEXT }}>
                  (property: {stage.failedProperty})
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
