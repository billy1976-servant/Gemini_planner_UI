/**
 * Spacing Audit panel — palette padding | layout gap | molecule gap | atom gap | DOM spacing.
 * Shows numeric row (e.g. 0 | 0 | 0 | 0 | 0) and highlights the first stage where non-zero was introduced.
 */

"use client";

import React, { useEffect, useState } from "react";
import { useSyncExternalStore } from "react";
import { getPaletteName, subscribePalette } from "@/engine/core/palette-store";
import { palettes } from "@/palettes";
import { resolveToken } from "@/engine/core/palette-resolve-token";
import {
  runVerticalSpacingDiagnostic,
  type VerticalSourceReport,
} from "./VerticalSpacingReport";

function parsePx(val: string | number | undefined): number {
  if (val === undefined || val === null) return 0;
  if (typeof val === "number" && !Number.isNaN(val)) return val;
  const s = String(val);
  if (!s || s === "0" || s === "0px") return 0;
  const m = s.match(/^([\d.]+)px?$/);
  return m ? parseFloat(m[1]) : 0;
}

export type SpacingAuditRow = {
  palettePadding: number;
  layoutGap: number;
  moleculeGap: number;
  atomGap: number;
  domSpacing: number;
  /** First stage id (palette | layout | molecule | atom | dom) with non-zero value */
  firstNonZeroStage: "palette" | "layout" | "molecule" | "atom" | "dom" | null;
};

function runSpacingAudit(verticalReport: VerticalSourceReport | null, palette: Record<string, any> | null): SpacingAuditRow {
  let palettePadding = 0;
  if (palette?.padding && typeof palette.padding === "object") {
    const firstKey = Object.keys(palette.padding)[0];
    if (firstKey) {
      const v = resolveToken(`padding.${firstKey}`, 0, palette);
      palettePadding = parsePx(v);
    }
  }

  let layoutGap = 0;
  let moleculeGap = 0;
  let atomGap = 0;
  let domSpacing = 0;

  if (verticalReport) {
    const section = verticalReport.sectionOuter;
    const sequence = verticalReport.sequenceAtom;
    const card = verticalReport.card;
    layoutGap = parsePx(section?.gap ?? 0);
    moleculeGap = parsePx(sequence?.gap ?? 0);
    atomGap = parsePx(card?.paddingTop ?? 0) || parsePx(card?.paddingBottom ?? 0);
    domSpacing = parsePx(section?.paddingTop ?? 0) || parsePx(section?.paddingBottom ?? 0);
  }

  const stages: Array<{ key: "palette" | "layout" | "molecule" | "atom" | "dom"; value: number }> = [
    { key: "palette", value: palettePadding },
    { key: "layout", value: layoutGap },
    { key: "molecule", value: moleculeGap },
    { key: "atom", value: atomGap },
    { key: "dom", value: domSpacing },
  ];
  const firstNonZero = stages.find((s) => s.value !== 0);
  return {
    palettePadding,
    layoutGap,
    moleculeGap,
    atomGap,
    domSpacing,
    firstNonZeroStage: firstNonZero?.key ?? null,
  };
}

const STAGE_LABELS = ["Palette padding", "Layout gap", "Molecule gap", "Atom gap", "DOM spacing"] as const;
const STAGE_KEYS: (keyof SpacingAuditRow)[] = [
  "palettePadding",
  "layoutGap",
  "moleculeGap",
  "atomGap",
  "domSpacing",
];

export default function SpacingAuditPanel() {
  const [verticalReport, setVerticalReport] = useState<VerticalSourceReport | null>(null);
  const paletteName = useSyncExternalStore(subscribePalette, getPaletteName, getPaletteName);
  const activePalette = (palettes as Record<string, unknown>)[paletteName as string] ?? null;

  useEffect(() => {
    const t = setTimeout(() => {
      setVerticalReport(runVerticalSpacingDiagnostic());
    }, 400);
    return () => clearTimeout(t);
  }, [paletteName]);

  const audit = runSpacingAudit(verticalReport, activePalette as Record<string, any> | null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, fontFamily: "system-ui, sans-serif", fontSize: 14 }}>
      <div style={{ fontWeight: 700, color: "#111" }}>Spacing Audit</div>
      <div style={{ fontSize: 13, color: "#6b7280" }}>
        palette padding | layout gap | molecule gap | atom gap | DOM spacing
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        {STAGE_KEYS.map((key, i) => {
          const value = audit[key] as number;
          const stageKey = ["palette", "layout", "molecule", "atom", "dom"][i] as SpacingAuditRow["firstNonZeroStage"];
          const isHighlight = audit.firstNonZeroStage === stageKey && value !== 0;
          return (
            <React.Fragment key={key}>
              {i > 0 && <span style={{ color: "#9ca3af" }}>|</span>}
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: 6,
                  fontWeight: 600,
                  fontSize: 14,
                  background: isHighlight ? "#fef2f2" : "transparent",
                  color: isHighlight ? "#b91c1c" : "#374151",
                  border: isHighlight ? "1px solid #fecaca" : "1px solid #e5e7eb",
                }}
                title={STAGE_LABELS[i]}
              >
                {value}
              </span>
            </React.Fragment>
          );
        })}
      </div>
      {audit.firstNonZeroStage != null && (
        <div style={{ fontSize: 13, color: "#b91c1c", fontWeight: 600 }}>
          Source layer (non-zero where not allowed): <strong>{audit.firstNonZeroStage}</strong>
        </div>
      )}
    </div>
  );
}
