/**
 * Pipeline Trace panel — shows JSON → Template → Layout → Palette → Molecule → Atom → Renderer → DOM
 * with PASS/FAIL per stage and optional contract check / trace link.
 */

"use client";

import React, { useMemo } from "react";
import { useSyncExternalStore } from "react";
import { getState, subscribeState } from "@/state/state-store";
import { getPaletteName } from "@/engine/core/palette-store";
import { getLayout, subscribeLayout } from "@/engine/core/layout-store";
import { palettes } from "@/palettes";
import { validatePaletteContract } from "@/diagnostics/pipeline/palette/contract";
import {
  PIPELINE_STAGE_ORDER,
  PIPELINE_STAGE_LABELS,
  type PipelineStageId,
  type PipelineStageResult,
} from "@/diagnostics/pipeline/types";

function usePipelineTrace(): PipelineStageResult[] {
  const stateSnapshot = useSyncExternalStore(subscribeState, getState, getState);
  const layoutSnapshot = useSyncExternalStore(subscribeLayout, getLayout, getLayout);
  const paletteName = (stateSnapshot?.values?.paletteName ?? getPaletteName()) || "default";
  const activePalette = (palettes as Record<string, unknown>)[paletteName] ?? null;

  return useMemo(() => {
    const results: PipelineStageResult[] = [];
    const templateId = (stateSnapshot?.values?.templateId ?? (layoutSnapshot as { templateId?: string })?.templateId) ?? "";

    for (const stageId of PIPELINE_STAGE_ORDER) {
      const label = PIPELINE_STAGE_LABELS[stageId];
      let pass = true;
      let message: string | undefined;
      let contractResult: string | undefined;
      let traceLink: string | undefined;

      switch (stageId) {
        case "json":
          pass = !!stateSnapshot?.values;
          message = pass ? "Screen state loaded" : "No screen state";
          break;
        case "template":
          pass = true;
          message = templateId ? `Template: ${templateId}` : "Experience only (no template)";
          break;
        case "layout":
          pass = !!layoutSnapshot;
          message = pass ? "Layout resolved" : "Layout missing";
          break;
        case "palette": {
          const check = validatePaletteContract(activePalette as any);
          pass = check.ok;
          contractResult = check.ok ? "Contract OK" : check.failures.join("; ");
          message = check.ok ? "Palette contract OK" : check.failures.join(", ");
          traceLink = "Palette tab";
          break;
        }
        case "molecule":
          pass = true;
          message = "Molecules from registry";
          break;
        case "atom":
          pass = true;
          message = "Atoms resolve tokens";
          break;
        case "renderer":
          pass = typeof document !== "undefined";
          message = pass ? "Renderer active" : "SSR";
          break;
        case "dom":
          pass = typeof document !== "undefined" && !!document.body;
          message = pass ? "DOM mounted" : "No DOM";
          break;
        default:
          pass = true;
          message = "—";
      }

      results.push({
        stageId: stageId as PipelineStageId,
        label,
        pass,
        message,
        contractResult,
        traceLink,
      });
    }
    return results;
  }, [stateSnapshot, layoutSnapshot, activePalette]);
}

const STYLES = {
  stageRow: (pass: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 6,
    fontSize: 12,
    fontFamily: "ui-monospace, monospace",
    background: pass ? "rgba(22, 121, 78, 0.08)" : "rgba(180, 35, 24, 0.08)",
    color: pass ? "#18794E" : "#B42318",
    marginBottom: 4,
  }),
  arrow: { color: "#6b7280", fontSize: 10 } as React.CSSProperties,
  link: { color: "#1a73e8", cursor: "pointer", textDecoration: "underline" } as React.CSSProperties,
};

export default function PipelineTracePanel() {
  const stages = usePipelineTrace();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: "#202124" }}>
        Pipeline Trace
      </div>
      <div style={{ fontSize: 11, color: "#5f6368", marginBottom: 8 }}>
        JSON → Template → Layout → Palette → Molecule → Atom → Renderer → DOM
      </div>
      {stages.map((stage, i) => (
        <div key={stage.stageId}>
          {i > 0 && <div style={{ ...STYLES.arrow, paddingLeft: 10 }}>→</div>}
          <div style={STYLES.stageRow(stage.pass)}>
            <span style={{ fontWeight: 600, minWidth: 70 }}>{stage.label}</span>
            <span>{stage.pass ? "PASS" : "FAIL"}</span>
            {stage.contractResult != null && (
              <span style={{ fontSize: 11, opacity: 0.9 }}> ({stage.contractResult})</span>
            )}
            {stage.message != null && stage.message !== stage.contractResult && (
              <span style={{ fontSize: 11, opacity: 0.85 }}> — {stage.message}</span>
            )}
            {stage.traceLink != null && (
              <span style={STYLES.link} title="See trace in Palette tab">
                {stage.traceLink}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
