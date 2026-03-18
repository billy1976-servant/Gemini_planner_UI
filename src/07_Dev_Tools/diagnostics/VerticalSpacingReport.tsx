"use client";

import React, { useEffect, useState } from "react";

export type LayerReport = {
  paddingTop: string;
  paddingBottom: string;
  marginTop: string;
  marginBottom: string;
  gap: string;
};

export type VerticalSourceReport = {
  sectionOuter: LayerReport;
  sequenceAtom: LayerReport | null;
  card: LayerReport | null;
  button: LayerReport | null;
  stepper: LayerReport | null;
  phoneFrame: LayerReport | null;
  violations: string[];
};

function parsePx(val: string): number {
  if (!val || val === "0" || val === "0px") return 0;
  const m = val.match(/^([\d.]+)px$/);
  return m ? parseFloat(m[1]) : 0;
}

function isZero(l: LayerReport): boolean {
  return (
    parsePx(l.paddingTop) === 0 &&
    parsePx(l.paddingBottom) === 0 &&
    parsePx(l.marginTop) === 0 &&
    parsePx(l.marginBottom) === 0 &&
    parsePx(l.gap) === 0
  );
}

function getLayerReport(el: Element | null): LayerReport | null {
  if (!el) return null;
  const s = window.getComputedStyle(el);
  return {
    paddingTop: s.paddingTop,
    paddingBottom: s.paddingBottom,
    marginTop: s.marginTop,
    marginBottom: s.marginBottom,
    gap: s.gap || "0",
  };
}

/** Layout-engine is allowed to set section inner padding/gap; other layers must be 0. */
export function runVerticalSpacingDiagnostic(): VerticalSourceReport {
  const violations: string[] = [];
  const empty: LayerReport = {
    paddingTop: "0",
    paddingBottom: "0",
    marginTop: "0",
    marginBottom: "0",
    gap: "0",
  };

  const sectionOuter = document.querySelector("[data-layout-2]");
  const sectionReport = getLayerReport(sectionOuter);
  const sectionOuterReport = sectionReport ?? empty;

  let sequenceAtomReport: LayerReport | null = null;
  let cardReport: LayerReport | null = null;
  let buttonReport: LayerReport | null = null;
  let stepperReport: LayerReport | null = null;

  if (sectionOuter) {
    const inner = sectionOuter.querySelector("[data-layout-2] + *") ?? sectionOuter.firstElementChild;
    const sequenceEl = inner?.querySelector?.("[style*='flex']") ?? inner?.firstElementChild;
    sequenceAtomReport = getLayerReport(sequenceEl ?? null) ?? empty;

    const cardEl = sectionOuter.querySelector('[data-hi-molecule="card"]') ?? sectionOuter.querySelector('[data-hi-molecule="Card"]');
    const cardSurface = cardEl?.firstElementChild;
    cardReport = getLayerReport(cardSurface ?? cardEl ?? null);

    const buttonEl = sectionOuter.querySelector('[data-hi-molecule="button"]') ?? sectionOuter.querySelector('[data-hi-molecule="Button"]');
    const buttonSurface = buttonEl?.firstElementChild;
    buttonReport = getLayerReport(buttonSurface ?? buttonEl ?? null);

    const stepperEl = sectionOuter.querySelector('[data-hi-molecule="stepper"]') ?? sectionOuter.querySelector('[data-hi-molecule="Stepper"]');
    const stepperSeq = stepperEl?.querySelector?.("[style*='flex']") ?? stepperEl?.firstElementChild;
    stepperReport = getLayerReport(stepperSeq ?? stepperEl ?? null);
  }

  const phoneFrame = document.querySelector("[data-phone-frame]");
  const phoneFrameReport = getLayerReport(phoneFrame ?? null);

  // Section outer: padding/gap can be from layout engine (allowed). margin must be 0.
  if (sectionOuterReport.marginTop !== "0" && parsePx(sectionOuterReport.marginTop) > 0)
    violations.push("SECTION OUTER: marginTop > 0");
  if (sectionOuterReport.marginBottom !== "0" && parsePx(sectionOuterReport.marginBottom) > 0)
    violations.push("SECTION OUTER: marginBottom > 0");

  // Sequence atom (section inner): padding/gap from layout engine allowed. No violation for padding/gap.
  if (sequenceAtomReport && !isZero(sequenceAtomReport)) {
    if (parsePx(sequenceAtomReport.marginTop) > 0 || parsePx(sequenceAtomReport.marginBottom) > 0)
      violations.push("SEQUENCE ATOM: non-zero margin");
  }

  // Card, button, stepper must be 0 (non-layout).
  if (cardReport && !isZero(cardReport))
    violations.push("CARD: non-layout vertical spacing detected");
  if (buttonReport && !isZero(buttonReport))
    violations.push("BUTTON: non-layout vertical spacing detected");
  if (stepperReport && !isZero(stepperReport))
    violations.push("STEPPER: non-layout vertical spacing detected");

  // Phone frame: must be 0 vertical (we use 0 12px).
  if (phoneFrameReport && (parsePx(phoneFrameReport.paddingTop) > 0 || parsePx(phoneFrameReport.paddingBottom) > 0))
    violations.push("PHONE FRAME: vertical padding > 0");

  if (violations.length > 0) {
    console.error("[SPACING VIOLATION] Non-layout vertical spacing detected", violations);
  }

  return {
    sectionOuter: sectionOuterReport,
    sequenceAtom: sequenceAtomReport,
    card: cardReport,
    button: buttonReport,
    stepper: stepperReport,
    phoneFrame: phoneFrameReport ?? empty,
    violations,
  };
}

function formatLayer(name: string, l: LayerReport | null): string {
  if (!l) return `${name}: (no element)`;
  return [
    `${name}`,
    `  paddingTop: ${l.paddingTop}`,
    `  paddingBottom: ${l.paddingBottom}`,
    `  marginTop: ${l.marginTop}`,
    `  marginBottom: ${l.marginBottom}`,
    `  gap: ${l.gap}`,
  ].join("\n");
}

export default function VerticalSpacingReport() {
  const [report, setReport] = useState<VerticalSourceReport | null>(null);

  useEffect(() => {
    const run = () => {
      const r = runVerticalSpacingDiagnostic();
      setReport(r);
    };
    const t = setTimeout(run, 500);
    return () => clearTimeout(t);
  }, []);

  if (!report) return <div style={{ fontSize: "var(--font-size-xs)", padding: "var(--spacing-2)" }}>Measuring…</div>;

  const hasViolations = report.violations.length > 0;

  return (
    <div
      style={{
        fontSize: "11px",
        fontFamily: "monospace",
        padding: "var(--spacing-2)",
        background: hasViolations ? "rgba(200,0,0,0.1)" : "rgba(0,0,0,0.05)",
        border: hasViolations ? "1px solid var(--color-error, red)" : "1px solid var(--color-outline, #ccc)",
        borderRadius: "4px",
        whiteSpace: "pre-wrap",
        maxHeight: "320px",
        overflow: "auto",
      }}
      data-vertical-spacing-report
    >
      <div style={{ fontWeight: 700, marginBottom: "4px" }}>VERTICAL SOURCE REPORT</div>
      <div>{formatLayer("SECTION OUTER", report.sectionOuter)}</div>
      <div>{formatLayer("SEQUENCE ATOM", report.sequenceAtom)}</div>
      <div>{formatLayer("CARD", report.card)}</div>
      <div>{formatLayer("BUTTON", report.button)}</div>
      <div>{formatLayer("STEPPER", report.stepper)}</div>
      <div>{formatLayer("PHONE FRAME", report.phoneFrame)}</div>
      {hasViolations && (
        <div style={{ marginTop: "8px", color: "var(--color-error, red)", fontWeight: 600 }}>
          [SPACING VIOLATION] {report.violations.join("; ")}
        </div>
      )}
    </div>
  );
}
