/**
 * Layout tab: per-section geometry (child count, direction, width distribution, layout engine trace).
 * Red warning if layout engine produced invalid geometry.
 */

"use client";

import React, { useEffect, useState } from "react";
import { runVerticalSpacingDiagnostic } from "./VerticalSpacingReport";

function parsePx(val: string): number {
  if (!val || val === "0" || val === "0px") return 0;
  const m = val.match(/^([\d.]+)px$/);
  return m ? parseFloat(m[1]) : 0;
}

type SectionRow = {
  sectionId: string;
  childCount: number;
  direction: string;
  gap: string;
  paddingTop: string;
  paddingBottom: string;
  widthSample: string;
  invalidGeometry: boolean;
};

function gatherSectionGeometry(): SectionRow[] {
  const rows: SectionRow[] = [];
  if (typeof document === "undefined") return rows;

  const sectionOuters = document.querySelectorAll("[data-layout-2], [data-section]");
  sectionOuters.forEach((el, i) => {
    const sectionId = (el.getAttribute("data-section") ?? el.getAttribute("data-layout-2") ?? `section-${i}`) as string;
    const style = window.getComputedStyle(el);
    const flexDir = style.flexDirection;
    const childCount = el.children.length;
    const gap = style.gap || "0";
    const paddingTop = style.paddingTop || "0";
    const paddingBottom = style.paddingBottom || "0";
    const firstChild = el.firstElementChild;
    const widthSample = firstChild ? window.getComputedStyle(firstChild).width : "—";
    const invalidGeometry = childCount > 0 && widthSample !== "—" && parsePx(widthSample) === 0 && style.display !== "none";
    rows.push({
      sectionId,
      childCount,
      direction: flexDir || "—",
      gap,
      paddingTop,
      paddingBottom,
      widthSample,
      invalidGeometry: !!invalidGeometry,
    });
  });

  if (rows.length === 0) {
    const fallback = document.querySelector("[data-layout-2]");
    if (fallback) {
      const style = window.getComputedStyle(fallback);
      rows.push({
        sectionId: "section-0",
        childCount: fallback.children.length,
        direction: style.flexDirection || "—",
        gap: style.gap || "0",
        paddingTop: style.paddingTop || "0",
        paddingBottom: style.paddingBottom || "0",
        widthSample: fallback.firstElementChild ? window.getComputedStyle(fallback.firstElementChild).width : "—",
        invalidGeometry: false,
      });
    }
  }
  return rows;
}

const FAIL_TEXT = "#b91c1c";

export default function LayoutDiagnosticsPanel() {
  const [sections, setSections] = useState<SectionRow[]>([]);
  const [violations, setViolations] = useState<string[]>([]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSections(gatherSectionGeometry());
      const report = runVerticalSpacingDiagnostic();
      setViolations(report.violations);
    }, 400);
    return () => clearTimeout(t);
  }, []);

  const hasInvalid = sections.some((s) => s.invalidGeometry) || violations.length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, fontSize: 14, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: "#111" }}>Layout (geometry engine)</div>
      {hasInvalid && (
        <div
          style={{
            padding: 12,
            borderRadius: 8,
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: FAIL_TEXT,
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          Layout engine produced invalid geometry
        </div>
      )}
      {violations.length > 0 && (
        <div style={{ fontSize: 13, color: FAIL_TEXT }}>
          {violations.map((v, i) => (
            <div key={i}>{v}</div>
          ))}
        </div>
      )}
      {sections.length === 0 ? (
        <div style={{ color: "#6b7280", fontSize: 13 }}>No sections found. Load a screen with sections.</div>
      ) : (
        sections.map((row) => (
          <div
            key={row.sectionId}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              padding: 12,
              background: row.invalidGeometry ? "#fef2f2" : "#fff",
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 8, color: row.invalidGeometry ? FAIL_TEXT : "#111" }}>
              {row.sectionId}
            </div>
            <div style={{ display: "grid", gap: 4, fontSize: 13, fontFamily: "ui-monospace, monospace", color: "#374151" }}>
              <div>child count: {row.childCount}</div>
              <div>direction: {row.direction}</div>
              <div>gap: {row.gap}</div>
              <div>paddingTop: {row.paddingTop} paddingBottom: {row.paddingBottom}</div>
              <div>width (first child): {row.widthSample}</div>
              {row.invalidGeometry && (
                <div style={{ color: FAIL_TEXT, fontWeight: 600 }}>Invalid geometry (zero width with children)</div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
