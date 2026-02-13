/**
 * Palette Contract Inspector — read-only dropdown at top of Palette sidebar.
 * Global PASS/FAIL, expandable groups, per-token drilldown with trace and DOM probes.
 * No engine changes.
 */

"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { resolveToken } from "@/engine/core/palette-resolve-token";
import { inspectPaletteToken, type TokenProbeResult, type TraceStep } from "./paletteTokenInspector";
import TokenProbeHost, { type TokenProbeHostRef } from "./TokenProbeHost";
import { setTokenTraceView } from "@/diagnostics/inspectorStore";

const GROUPS_ORDER: string[] = [
  "color",
  "surface",
  "textSize",
  "textWeight",
  "textRole",
  "padding",
  "gap",
  "radius",
  "elevation",
  "shadow",
  "spacing",
];

function isPrimitive(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  const t = typeof value;
  return t === "string" || t === "number" || t === "boolean";
}

function displayValue(value: unknown): string {
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  if (typeof value === "object") {
    try {
      const s = JSON.stringify(value);
      return s.length > 60 ? s.slice(0, 60) + "…" : s;
    } catch {
      return "[object]";
    }
  }
  return String(value);
}

function getExpectedType(groupKey: string): string {
  if (["textRole", "surfaceTier", "prominence"].includes(groupKey)) return "object (role def)";
  return "primitive";
}

/** Resolve a token path using the given palette (diagnostics only). */
function resolveWithPalette(path: string, pal: Record<string, any> | null | undefined): unknown {
  if (!path || !pal) return undefined;
  return resolveToken(path, 0, pal ?? undefined);
}

const DIAG_COMPUTED_KEYS = ["fontSize", "fontWeight", "lineHeight", "padding", "gap", "borderRadius", "color", "background", "backgroundColor", "boxShadow"] as const;

type OriginTrace = {
  component: string;
  molecule: string;
  compound: string;
  layout: string;
  screen: string;
  jsonPath: string;
};

type ElementType = "text" | "svg" | "img" | "button" | "container";

type IconInfo =
  | { kind: "img"; src: string; naturalWidth: number; naturalHeight: number }
  | { kind: "svg"; inline: true; viewBox: string; width: string; height: string }
  | null;

function collectOriginTrace(el: HTMLElement): OriginTrace {
  const out: OriginTrace = {
    component: "unknown",
    molecule: "unknown",
    compound: "unknown",
    layout: "unknown",
    screen: "unknown",
    jsonPath: "unknown",
  };
  let node: Element | null = el;
  while (node && node !== document.body) {
    const d = "dataset" in node ? (node as HTMLElement).dataset : ({} as Record<string, string>);
    if (out.component === "unknown" && d.component) out.component = String(d.component);
    if (out.molecule === "unknown" && d.molecule) out.molecule = String(d.molecule);
    if (out.compound === "unknown" && d.compound) out.compound = String(d.compound);
    if (out.layout === "unknown" && d.layout) out.layout = String(d.layout);
    if (out.screen === "unknown" && d.screen) out.screen = String(d.screen);
    if (out.jsonPath === "unknown" && d.jsonPath) out.jsonPath = String(d.jsonPath);
    node = node.parentElement;
  }
  return out;
}

function classifyElementType(el: HTMLElement): ElementType {
  const tag = el.tagName;
  if (tag === "IMG") return "img";
  if (tag === "SVG") return "svg";
  const role = el.getAttribute("role");
  if (role === "button" || tag === "BUTTON" || tag === "INPUT") return "button";
  const text = (el as HTMLElement).innerText?.trim() ?? "";
  if (text.length > 0) return "text";
  return "container";
}

function getIconInfo(el: HTMLElement): IconInfo {
  if (el.tagName === "IMG") {
    const img = el as HTMLImageElement;
    return {
      kind: "img",
      src: img.src ?? img.getAttribute("src") ?? "—",
      naturalWidth: img.naturalWidth ?? 0,
      naturalHeight: img.naturalHeight ?? 0,
    };
  }
  if (el.tagName === "SVG") {
    const s = getComputedStyle(el);
    return {
      kind: "svg",
      inline: true,
      viewBox: el.getAttribute("viewBox") ?? "—",
      width: s.width ?? "—",
      height: s.height ?? "—",
    };
  }
  return null;
}

type HoverDiagnostic = {
  rect: DOMRect;
  elementLabel: string;
  tokenNotFound: string | null;
  expected: Record<string, string>;
  actual: Record<string, string>;
  statuses: Record<string, boolean>;
  pipeline: string[];
  originTrace: OriginTrace;
  resolverHint: string;
  elementType: ElementType;
  iconInfo: IconInfo;
  statusFlags: {
    palettePass: boolean;
    textRoleMatch: boolean;
    tokenResolved: boolean;
    resolverKnown: boolean;
    componentOriginFound: boolean;
    moleculeKnown: boolean;
  };
};

function parsePx(s: string): number | null {
  if (s === "" || s == null) return null;
  const n = parseFloat(s);
  if (!Number.isNaN(n)) return n;
  const m = s.match(/^([\d.]+)px$/);
  return m ? parseFloat(m[1]) : null;
}

function getTextRoleExpected(palette: any, roleName: string): { size?: string; weight?: string; lineHeight?: string; [k: string]: string | undefined } | null {
  const textRole = palette?.textRole?.[roleName];
  if (!textRole || typeof textRole !== "object") return null;
  const out: Record<string, string> = {};
  const sizeToken = textRole.size; if (typeof sizeToken === "string") out.size = String(resolveWithPalette(sizeToken, palette) ?? sizeToken);
  const weightToken = textRole.weight; if (typeof weightToken === "string") out.weight = String(resolveWithPalette(weightToken, palette) ?? weightToken);
  const lhToken = textRole.lineHeight; if (typeof lhToken === "string") out.lineHeight = String(resolveWithPalette(lhToken, palette) ?? lhToken);
  const lsToken = textRole.letterSpacing; if (typeof lsToken === "string") out.letterSpacing = String(resolveWithPalette(lsToken, palette) ?? lsToken);
  const colorToken = textRole.color; if (typeof colorToken === "string") out.color = String(resolveWithPalette(colorToken, palette) ?? colorToken);
  return out;
}

function detectTextRoleFromComputed(palette: any, computed: Record<string, string>): string | null {
  const roles = palette?.textRole && typeof palette.textRole === "object" ? Object.keys(palette.textRole) : [];
  const actualSize = parsePx(computed.fontSize ?? "");
  const actualWeight = parsePx(computed.fontWeight ?? "") ?? (computed.fontWeight === "bold" ? 700 : computed.fontWeight === "normal" ? 400 : null);
  const actualLh = parsePx(computed.lineHeight ?? "") ?? parseFloat(computed.lineHeight ?? "");
  let bestRole: string | null = null;
  let bestScore = -1;
  for (const role of roles) {
    const exp = getTextRoleExpected(palette, role);
    if (!exp) continue;
    const expSize = exp.size != null ? parsePx(exp.size + "px") ?? parseFloat(exp.size) : null;
    const expWeight = exp.weight != null ? parseFloat(exp.weight) : null;
    const expLh = exp.lineHeight != null ? parseFloat(exp.lineHeight) : null;
    let score = 0;
    if (expSize != null && actualSize != null && Math.abs(expSize - actualSize) < 2) score += 3;
    else if (expSize != null && actualSize != null) score -= 2;
    if (expWeight != null && actualWeight != null && Math.abs(expWeight - actualWeight) < 50) score += 2;
    else if (expWeight != null && actualWeight != null) score -= 1;
    if (expLh != null && !Number.isNaN(actualLh) && Math.abs(expLh - actualLh) < 0.1) score += 1;
    if (score > bestScore) { bestScore = score; bestRole = role; }
  }
  return bestRole;
}

function buildHoverDiagnostic(el: HTMLElement, palette: any): HoverDiagnostic | null {
  const s = getComputedStyle(el);
  const computed: Record<string, string> = {};
  for (const k of DIAG_COMPUTED_KEYS) {
    const v = (s as any)[k];
    if (v != null && v !== "") computed[k] = String(v);
  }
  const actual: Record<string, string> = {
    size: computed.fontSize ?? "—",
    weight: computed.fontWeight ?? "—",
    lineHeight: computed.lineHeight ?? "—",
    padding: computed.padding ?? "—",
    gap: computed.gap ?? "—",
    borderRadius: computed.borderRadius ?? "—",
    color: computed.color ?? computed.backgroundColor ?? "—",
    background: computed.background ?? computed.backgroundColor ?? "—",
    boxShadow: computed.boxShadow ?? "—",
  };
  const roles = palette?.textRole && typeof palette.textRole === "object" ? Object.keys(palette.textRole) : [];
  const detectedRole = detectTextRoleFromComputed(palette, computed);
  let elementLabel = "element";
  let tokenNotFound: string | null = null;
  let expected: Record<string, string> = { size: "—", weight: "—", lineHeight: "—", padding: "—", gap: "—", borderRadius: "—", color: "—", background: "—", boxShadow: "—" };
  if (detectedRole) {
    elementLabel = `textRole.${detectedRole}`;
    const exp = getTextRoleExpected(palette, detectedRole);
    if (exp) {
      expected.size = exp.size != null ? (String(exp.size).match(/^\d+(\.\d+)?$/) ? `${exp.size}px` : String(exp.size)) : "—";
      expected.weight = exp.weight ?? "—";
      expected.lineHeight = exp.lineHeight ?? "—";
    } else {
      tokenNotFound = `textRole.${detectedRole}`;
    }
  } else if (roles.length === 0) {
    tokenNotFound = "textRole (no roles in palette)";
  }
  const statuses: Record<string, boolean> = {};
  const norm = (v: string) => (parsePx(v) ?? parseFloat(v) ?? v).toString();
  statuses.size = expected.size === "—" || actual.size === "—" ? true : Math.abs((parsePx(actual.size) ?? 0) - (parsePx(expected.size) ?? 0)) < 2;
  statuses.weight = expected.weight === "—" || actual.weight === "—" ? true : Math.abs((parseFloat(actual.weight) || 0) - (parseFloat(expected.weight) || 0)) < 50;
  statuses.lineHeight = expected.lineHeight === "—" || actual.lineHeight === "—" ? true : Math.abs((parseFloat(actual.lineHeight) || 0) - (parseFloat(expected.lineHeight) || 0)) < 0.15;
  statuses.color = expected.color === "—" || actual.color === "—" ? true : (actual.color?.replace(/\s/g, "") === expected.color?.replace(/\s/g, "") || !!actual.color);
  statuses.padding = true;
  statuses.gap = true;
  statuses.borderRadius = true;
  statuses.background = true;
  statuses.boxShadow = true;
  const resolverHint = detectedRole ? "applyTextRole()" : (actual.background && actual.background !== "none" && actual.background !== "rgba(0, 0, 0, 0)" ? "applySurface()" : "—");
  const pipeline = [
    "Resolved From: palette → " + elementLabel,
    "resolver → " + resolverHint,
    "final style → computedStyle",
  ];
  const originTrace = collectOriginTrace(el);
  const elementType = classifyElementType(el);
  const iconInfo = getIconInfo(el);
  const allStatusOk = Object.values(statuses).every(Boolean);
  const statusFlags = {
    palettePass: allStatusOk,
    textRoleMatch: !!detectedRole && statuses.size && statuses.weight && statuses.lineHeight,
    tokenResolved: !!elementLabel && elementLabel !== "element",
    resolverKnown: !!resolverHint && resolverHint !== "—",
    componentOriginFound: originTrace.component !== "unknown",
    moleculeKnown: originTrace.molecule !== "unknown",
  };
  return {
    rect: el.getBoundingClientRect(),
    elementLabel,
    tokenNotFound,
    expected,
    actual,
    statuses,
    pipeline,
    originTrace,
    resolverHint,
    elementType,
    iconInfo,
    statusFlags,
  };
}

export type TokenRow = { path: string; value: unknown; ok: boolean };
export type GroupResult = { groupKey: string; tokens: TokenRow[]; ok: boolean };

function computeInspection(palette: any): {
  globalOk: boolean;
  groups: GroupResult[];
} {
  const groups: GroupResult[] = [];
  let globalOk = true;

  if (!palette || typeof palette !== "object") {
    return {
      globalOk: false,
      groups: [
        {
          groupKey: "(no palette)",
          tokens: [{ path: "palette", value: undefined, ok: false }],
          ok: false,
        },
      ],
    };
  }

  const keys = Object.keys(palette);
  const groupKeys = [
    ...GROUPS_ORDER.filter((k) => keys.includes(k)),
    ...keys.filter((k) => !GROUPS_ORDER.includes(k)),
  ];

  for (const groupKey of groupKeys) {
    const val = palette[groupKey];
    if (val === undefined || val === null || typeof val !== "object") {
      groups.push({
        groupKey,
        tokens: [{ path: groupKey, value: val, ok: false }],
        ok: false,
      });
      globalOk = false;
      continue;
    }
    const tokens: TokenRow[] = [];
    const entries = Object.entries(val);
    for (const [tokenKey, rawValue] of entries) {
      const value = rawValue as unknown;
      const ok = isPrimitive(value);
      tokens.push({
        path: `${groupKey}.${tokenKey}`,
        value,
        ok,
      });
    }
    const groupOk = tokens.length > 0 && tokens.every((t) => t.ok);
    if (!groupOk) globalOk = false;
    groups.push({ groupKey, tokens, ok: groupOk });
  }

  if (groups.length === 0) globalOk = false;

  return { globalOk, groups };
}

const CHEVRON_DOWN = "▼";
const CHEVRON_RIGHT = "▶";
const CHECK = "✔";
const CROSS = "✖";

const STYLES = {
  header: (ok: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "6px 10px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    background: ok ? "#E6F6EC" : "#FDECEC",
    color: ok ? "#18794E" : "#B42318",
    border: `1px solid ${ok ? "#A7E3C3" : "#F5B5B5"}`,
    cursor: "pointer",
    userSelect: "none",
  }),
  chevron: { marginLeft: 8, fontSize: 10 },
  body: { marginTop: 8, display: "flex", flexDirection: "column" as const, gap: 4 },
  groupHeader: (ok: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 8px",
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
    background: ok ? "rgba(22, 121, 78, 0.08)" : "rgba(180, 35, 24, 0.08)",
    color: ok ? "#18794E" : "#B42318",
  }),
  tokenRow: (ok: boolean): React.CSSProperties => ({
    fontFamily: "ui-monospace, SF Mono, Menlo, monospace",
    fontSize: 11,
    padding: "2px 8px 2px 20px",
    color: ok ? "#18794E" : "#B42318",
    cursor: "pointer",
    position: "relative" as const,
  }),
  tooltip: (ok: boolean): React.CSSProperties => ({
    position: "absolute" as const,
    left: 20,
    top: "100%",
    marginTop: 2,
    zIndex: 100,
    padding: "6px 8px",
    borderRadius: 6,
    fontSize: 10,
    fontFamily: "ui-monospace, SF Mono, Menlo, monospace",
    background: "#1a1a1a",
    color: "#eee",
    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
    whiteSpace: "pre-wrap",
    maxWidth: 280,
  }),
  detailPanel: {
    marginTop: 4,
    marginLeft: 20,
    padding: 8,
    borderRadius: 6,
    fontSize: 11,
    fontFamily: "ui-monospace, SF Mono, Menlo, monospace",
    background: "#f8f9fa",
    border: "1px solid #dee2e6",
  },
  failBanner: {
    padding: "6px 8px",
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 600,
    background: "#FDECEC",
    color: "#B42318",
    border: "1px solid #F5B5B5",
    marginBottom: 8,
  },
  traceRow: (ok: boolean): React.CSSProperties => ({
    padding: "2px 0",
    color: ok ? "#18794E" : "#B42318",
  }),
};

export type PaletteContractInspectorProps = {
  palette: any;
};

export type ProbeResultRow = {
  pass: boolean;
  expected?: string;
  resolved?: unknown;
  computed?: Record<string, string>;
};

export default function PaletteContractInspector({ palette }: PaletteContractInspectorProps) {
  const [inspectMode, setInspectMode] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [expandedProbeRows, setExpandedProbeRows] = useState<Record<string, boolean>>({});
  const [selectedTokenKey, setSelectedTokenKey] = useState<string | null>(null);
  const [hoverTokenKey, setHoverTokenKey] = useState<string | null>(null);
  const [probeResults, setProbeResults] = useState<Record<string, Record<string, string>>>({});
  const [paletteProbeResults, setPaletteProbeResults] = useState<Record<string, ProbeResultRow> | null>(null);
  const [hoverDiagnostic, setHoverDiagnostic] = useState<HoverDiagnostic | null>(null);
  const [reportCopied, setReportCopied] = useState(false);
  const probeHostRef = useRef<TokenProbeHostRef>(null);
  const lastOutlinedRef = useRef<HTMLElement | null>(null);
  const lastHoverRunRef = useRef(0);
  const HOVER_THROTTLE_MS = 60;

  const { globalOk, groups } = useMemo(() => computeInspection(palette), [palette]);

  useEffect(() => {
    if (!inspectMode) {
      setHoverDiagnostic(null);
      if (lastOutlinedRef.current) {
        lastOutlinedRef.current.style.outline = "";
        lastOutlinedRef.current = null;
      }
      return;
    }
    const onMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastHoverRunRef.current < HOVER_THROTTLE_MS) return;
      lastHoverRunRef.current = now;

      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      if (lastOutlinedRef.current && lastOutlinedRef.current !== el) {
        lastOutlinedRef.current.style.outline = "";
        lastOutlinedRef.current = null;
      }
      if (!el) {
        setHoverDiagnostic(null);
        return;
      }
      const diag = buildHoverDiagnostic(el, palette);
      setHoverDiagnostic(diag);
      const anyFail = diag && Object.values(diag.statuses).some((v) => !v);
      el.style.outline = anyFail ? "2px solid #dc2626" : "2px solid #22c55e";
      lastOutlinedRef.current = el;
    };
    const onClick = (e: MouseEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (!el) return;
      const htmlEl = el instanceof HTMLElement ? el : null;
      const diag = htmlEl ? buildHoverDiagnostic(htmlEl, palette) : null;
      const computedStyle: Record<string, string> = {};
      if (el instanceof Element) {
        const s = getComputedStyle(el);
        for (const k of DIAG_COMPUTED_KEYS) {
          const v = (s as any)[k];
          if (v != null && v !== "") computedStyle[k] = String(v);
        }
      }
      console.log("[PALETTE ORIGIN TRACE]", {
        elementType: diag?.elementType ?? "unknown",
        component: diag?.originTrace.component ?? "unknown",
        molecule: diag?.originTrace.molecule ?? "unknown",
        compound: diag?.originTrace.compound ?? "unknown",
        layout: diag?.originTrace.layout ?? "unknown",
        screen: diag?.originTrace.screen ?? "unknown",
        jsonPath: diag?.originTrace.jsonPath ?? "unknown",
        computedStyle,
        iconInfo: diag?.iconInfo ?? null,
      });
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("click", onClick);
      setHoverDiagnostic(null);
      if (lastOutlinedRef.current) {
        lastOutlinedRef.current.style.outline = "";
        lastOutlinedRef.current = null;
      }
    };
  }, [inspectMode, palette]);

  const tokenDetailsMap = useMemo(() => {
    const map: Record<string, TokenProbeResult> = {};
    for (const gr of groups) {
      for (const t of gr.tokens) {
        map[t.path] = inspectPaletteToken({ keyPath: t.path, palette });
      }
    }
    return map;
  }, [palette, groups]);

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  const visibleTokenPaths = useMemo(() => {
    const paths: string[] = [];
    for (const gr of groups) {
      if (expandedGroups[gr.groupKey]) {
        for (const t of gr.tokens) paths.push(t.path);
      }
    }
    return paths;
  }, [groups, expandedGroups]);

  const runProbes = () => {
    const host = probeHostRef.current;
    if (!host) return;
    const next: Record<string, Record<string, string>> = {};
    for (const keyPath of visibleTokenPaths) {
      const detail = tokenDetailsMap[keyPath];
      if (detail && detail.resolved !== undefined && detail.resolved !== null) {
        try {
          next[keyPath] = host.runProbe({ keyPath, resolvedValue: detail.resolved });
        } catch {
          next[keyPath] = {};
        }
      }
    }
    setProbeResults((prev) => ({ ...prev, ...next }));
  };

  function runPaletteProbes() {
    const results: Record<string, ProbeResultRow> = {};
    for (const gr of groups) {
      const groupKey = gr.groupKey;
      const val = palette?.[groupKey];
      const pass = val != null && typeof val === "object";
      const firstTokenPath = pass && val && typeof val === "object"
        ? `${groupKey}.${Object.keys(val)[0] ?? "?"}`
        : undefined;
      let expected: string | undefined;
      let resolved: unknown;
      let computed: Record<string, string> | undefined;
      if (groupKey === "textRole" || groupKey === "surfaceTier" || groupKey === "prominence") {
        expected = "object (role def)";
      } else {
        expected = "primitive";
      }
      resolved = val;
      if (firstTokenPath && probeHostRef.current) {
        const detail = inspectPaletteToken({ keyPath: firstTokenPath, palette });
        if (detail.resolved !== undefined && detail.resolved !== null) {
          try {
            computed = probeHostRef.current.runProbe({ keyPath: firstTokenPath, resolvedValue: detail.resolved });
          } catch {
            computed = {};
          }
        }
      }
      results[groupKey] = { pass, expected, resolved, computed };
    }
    setPaletteProbeResults(results);
    runProbes();
  }

  function buildPaletteReport(): string {
    const lines: string[] = ["PALETTE REPORT", "--------------"];
    let hasAny = false;

    if (paletteProbeResults) {
      for (const [groupKey, row] of Object.entries(paletteProbeResults)) {
        if (!row || row.pass) continue;
        hasAny = true;
        lines.push(`FAIL: ${groupKey}`);
        if (row.expected != null) lines.push(`  expected: ${row.expected}`);
        if (row.resolved !== undefined && row.resolved !== null) lines.push(`  resolved: ${displayValue(row.resolved)}`);
        if (row.computed && Object.keys(row.computed).length > 0) {
          lines.push(`  actual: ${Object.entries(row.computed).map(([k, v]) => `${k}=${v}`).join("; ")}`);
        }
        lines.push("");
      }
    }

    for (const gr of groups) {
      for (const t of gr.tokens) {
        if (t.ok) continue;
        hasAny = true;
        const detail = tokenDetailsMap[t.path];
        lines.push(`FAIL: ${t.path}`);
        lines.push(`  expected: ${displayValue(t.value)}`);
        if (detail?.resolved !== undefined) lines.push(`  actual: ${displayValue(detail.resolved)}`);
        lines.push("");
      }
    }

    if (hoverDiagnostic) {
      const d = hoverDiagnostic;
      const hoverMismatches: string[] = [];
      if (!d.statuses.size) hoverMismatches.push("size mismatch");
      if (!d.statuses.weight) hoverMismatches.push("weight mismatch");
      if (!d.statuses.lineHeight) hoverMismatches.push("lineHeight mismatch");
      if (!d.statuses.color) hoverMismatches.push("color mismatch");
      if (d.tokenNotFound) hoverMismatches.push("token mismatch");
      if (!d.statusFlags.palettePass) hoverMismatches.push("palette fail");
      if (hoverMismatches.length > 0) {
        hasAny = true;
        lines.push(`Last hovered: ${d.elementLabel}`);
        lines.push(`  size: expected ${d.expected.size} → actual ${d.actual.size}`);
        lines.push(`  weight: expected ${d.expected.weight} → actual ${d.actual.weight}`);
        lines.push(`  lineHeight: expected ${d.expected.lineHeight} → actual ${d.actual.lineHeight}`);
        hoverMismatches.forEach((m) => lines.push(`  ${m}`));
        lines.push("");
      }

      const unknown: string[] = [];
      if (d.originTrace.component === "unknown") unknown.push("component unknown");
      if (d.originTrace.molecule === "unknown") unknown.push("molecule unknown");
      if (d.originTrace.layout === "unknown") unknown.push("layout unknown");
      if (d.originTrace.jsonPath === "unknown") unknown.push("json path unknown");
      if (d.originTrace.compound === "unknown") unknown.push("compound unknown");
      if (d.originTrace.screen === "unknown") unknown.push("screen unknown");
      if (unknown.length > 0) {
        hasAny = true;
        lines.push("Unknown origin:");
        unknown.forEach((u) => lines.push(`  ${u}`));
        lines.push("");
      }
    }

    if (!hasAny) return "PALETTE REPORT\n--------------\nNo failures.";
    return lines.join("\n").replace(/\n\n+$/, "\n");
  }

  const selectedDetail = selectedTokenKey ? tokenDetailsMap[selectedTokenKey] : null;
  const firstFailingStep = selectedDetail?.trace?.find((s) => !s.ok);

  return (
    <div style={{ marginBottom: 10 }}>
      <TokenProbeHost ref={probeHostRef} />

      <button
        type="button"
        onClick={() => setInspectMode((v) => !v)}
        style={{
          marginBottom: 8,
          padding: "4px 10px",
          fontSize: 11,
          fontWeight: 500,
          borderRadius: 9999,
          border: `1px solid ${inspectMode ? "#22c55e" : "#d1d5db"}`,
          background: inspectMode ? "rgba(34, 197, 94, 0.1)" : "#f9fafb",
          color: inspectMode ? "#16a34a" : "#6b7280",
          cursor: "pointer",
        }}
      >
        Inspect Mode {inspectMode ? "ON" : "OFF"}
      </button>

      {inspectMode && hoverDiagnostic && (
        <div
          style={{
            position: "fixed",
            left: Math.min(hoverDiagnostic.rect.right + 8, typeof window !== "undefined" ? window.innerWidth - 320 : 400),
            top: hoverDiagnostic.rect.top,
            width: 300,
            maxWidth: "90vw",
            padding: "10px 12px",
            fontSize: 11,
            fontFamily: "ui-monospace, SF Mono, Menlo, monospace",
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
            zIndex: 10000,
            pointerEvents: "none",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 6, color: "#111" }}>Element: {hoverDiagnostic.elementLabel}</div>
          {hoverDiagnostic.tokenNotFound && (
            <div style={{ marginBottom: 6, padding: "4px 6px", background: "#fef2f2", color: "#b91c1c", borderRadius: 4 }}>
              TOKEN NOT FOUND → {hoverDiagnostic.tokenNotFound}
            </div>
          )}
          <div style={{ marginBottom: 4 }}><strong>EXPECTED:</strong></div>
          <div style={{ marginLeft: 8, marginBottom: 6 }}>
            size → {hoverDiagnostic.expected.size} weight → {hoverDiagnostic.expected.weight} lineHeight → {hoverDiagnostic.expected.lineHeight}
          </div>
          <div style={{ marginBottom: 4 }}><strong>ACTUAL:</strong></div>
          <div style={{ marginLeft: 8, marginBottom: 8 }}>
            size → {hoverDiagnostic.actual.size} weight → {hoverDiagnostic.actual.weight} lineHeight → {hoverDiagnostic.actual.lineHeight}
          </div>
          <div style={{ marginBottom: 4 }}><strong>STATUS:</strong></div>
          <div style={{ marginLeft: 8 }}>
            {hoverDiagnostic.statuses.size ? <span style={{ color: "#16a34a" }}>✔ SIZE OK</span> : <span style={{ color: "#dc2626" }}>✖ SIZE MISMATCH</span>}
            {" "}
            {hoverDiagnostic.statuses.weight ? <span style={{ color: "#16a34a" }}>✔ WEIGHT OK</span> : <span style={{ color: "#dc2626" }}>✖ WEIGHT MISMATCH</span>}
            {" "}
            {hoverDiagnostic.statuses.lineHeight ? <span style={{ color: "#16a34a" }}>✔ LINE-HEIGHT OK</span> : <span style={{ color: "#dc2626" }}>✖ LINE-HEIGHT MISMATCH</span>}
            <br />
            {hoverDiagnostic.statuses.color ? <span style={{ color: "#16a34a" }}>✔ COLOR OK</span> : <span style={{ color: "#dc2626" }}>✖ COLOR MISMATCH</span>}
            <br />
            {hoverDiagnostic.statusFlags.tokenResolved ? <span style={{ color: "#16a34a" }}>✔ token resolved</span> : <span style={{ color: "#dc2626" }}>✖ token unresolved</span>}
            {hoverDiagnostic.statusFlags.textRoleMatch ? <span style={{ color: "#16a34a" }}> ✔ textRole match</span> : (hoverDiagnostic.elementLabel !== "element" ? <span style={{ color: "#dc2626" }}> ✖ textRole mismatch</span> : null)}
            {hoverDiagnostic.statusFlags.resolverKnown ? <span style={{ color: "#16a34a" }}> ✔ resolver known</span> : <span style={{ color: "#dc2626" }}> ✖ missing resolver</span>}
            <br />
            {hoverDiagnostic.statusFlags.palettePass ? <span style={{ color: "#16a34a" }}>✔ palette PASS</span> : <span style={{ color: "#dc2626" }}>✖ palette FAIL</span>}
            {hoverDiagnostic.statusFlags.componentOriginFound ? <span style={{ color: "#16a34a" }}> ✔ component origin found</span> : <span style={{ color: "#dc2626" }}> ✖ component unknown</span>}
            {hoverDiagnostic.statusFlags.moleculeKnown ? <span style={{ color: "#16a34a" }}> ✔ molecule known</span> : <span style={{ color: "#dc2626" }}> ✖ molecule unknown</span>}
          </div>
          <div style={{ marginTop: 8, paddingTop: 6, borderTop: "1px solid #e5e7eb", fontSize: 10, color: "#374151" }}>
            <strong>Element Type:</strong> {hoverDiagnostic.elementType}
          </div>
          {hoverDiagnostic.iconInfo && (
            <div style={{ marginTop: 4, fontSize: 10, color: "#374151" }}>
              {hoverDiagnostic.iconInfo.kind === "img" && (
                <>
                  <strong>IMG:</strong> src → {hoverDiagnostic.iconInfo.src.length > 40 ? hoverDiagnostic.iconInfo.src.slice(0, 40) + "…" : hoverDiagnostic.iconInfo.src}
                  <br />
                  naturalWidth × naturalHeight → {hoverDiagnostic.iconInfo.naturalWidth} × {hoverDiagnostic.iconInfo.naturalHeight}
                </>
              )}
              {hoverDiagnostic.iconInfo.kind === "svg" && (
                <>
                  <strong>SVG:</strong> inline svg = true
                  <br />
                  viewBox → {hoverDiagnostic.iconInfo.viewBox} | width × height → {hoverDiagnostic.iconInfo.width} × {hoverDiagnostic.iconInfo.height}
                </>
              )}
            </div>
          )}
          <div style={{ marginTop: 8, paddingTop: 6, borderTop: "1px solid #e5e7eb", fontSize: 10, color: "#374151" }}>
            <strong>RENDER ORIGIN</strong>
            <div style={{ marginLeft: 4, marginTop: 2 }}>Component: {hoverDiagnostic.originTrace.component}</div>
            <div style={{ marginLeft: 4 }}>Molecule: {hoverDiagnostic.originTrace.molecule}</div>
            <div style={{ marginLeft: 4 }}>Compound: {hoverDiagnostic.originTrace.compound}</div>
            <div style={{ marginLeft: 4 }}>Layout: {hoverDiagnostic.originTrace.layout}</div>
            <div style={{ marginLeft: 4 }}>Screen: {hoverDiagnostic.originTrace.screen}</div>
            <div style={{ marginLeft: 4 }}>JSON path: {hoverDiagnostic.originTrace.jsonPath}</div>
          </div>
          <div style={{ marginTop: 6, paddingTop: 6, borderTop: "1px solid #e5e7eb", fontSize: 10, color: "#6b7280" }}>
            <strong>STYLE PIPELINE</strong>
            <div style={{ marginLeft: 4, marginTop: 2 }}>Token source: {hoverDiagnostic.elementLabel}</div>
            <div style={{ marginLeft: 4 }}>Resolver used: {hoverDiagnostic.resolverHint}</div>
            <div style={{ marginLeft: 4 }}>Final computedStyle: {Object.entries(hoverDiagnostic.actual).slice(0, 4).map(([k, v]) => `${k}=${v}`).join("; ")}…</div>
          </div>
          <div style={{ marginTop: 6, fontSize: 10, color: "#6b7280" }}>
            {hoverDiagnostic.pipeline.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        </div>
      )}

      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setExpanded((x) => !x)}
        style={STYLES.header(globalOk)}
      >
        <span>Palette Contract: {globalOk ? "PASS" : "FAIL"}</span>
        <span style={STYLES.chevron}>{expanded ? CHEVRON_DOWN : CHEVRON_RIGHT}</span>
      </div>

      {expanded && (
        <div style={STYLES.body}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={runPaletteProbes}
              style={{
                padding: "4px 10px",
                fontSize: 11,
                fontWeight: 600,
                borderRadius: 6,
                border: "1px solid #dadce0",
                background: "#f1f3f4",
                cursor: "pointer",
              }}
            >
              Run Probes
            </button>
            {process.env.NODE_ENV === "development" && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    const report = buildPaletteReport();
                    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
                      navigator.clipboard.writeText(report).then(
                        () => {
                          setReportCopied(true);
                          setTimeout(() => setReportCopied(false), 2000);
                        },
                        () => setReportCopied(false),
                      );
                    }
                    console.log(report);
                  }}
                  style={{
                    padding: "4px 10px",
                    fontSize: 11,
                    fontWeight: 600,
                    borderRadius: 6,
                    border: "1px solid #dadce0",
                    background: "#f1f3f4",
                    cursor: "pointer",
                  }}
                >
                  Copy Report
                </button>
                {reportCopied && (
                  <span style={{ fontSize: 11, color: "#6b7280" }}>Report copied</span>
                )}
              </>
            )}
          </div>

          {paletteProbeResults && (
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#374151" }}>Probe breakdown</div>
              {(Object.keys(paletteProbeResults) as string[]).map((groupKey) => {
                const row = paletteProbeResults[groupKey];
                const isOpen = expandedProbeRows[groupKey];
                return (
                  <div key={groupKey} style={{ border: "1px solid #e5e7eb", borderRadius: 6, overflow: "hidden" }}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setExpandedProbeRows((p) => ({ ...p, [groupKey]: !p[groupKey] }))}
                      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setExpandedProbeRows((p) => ({ ...p, [groupKey]: !p[groupKey] }))}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "6px 8px",
                        fontSize: 11,
                        cursor: "pointer",
                        background: row?.pass ? "rgba(22, 121, 78, 0.06)" : "rgba(180, 35, 24, 0.06)",
                      }}
                    >
                      <span style={{ fontWeight: 500 }}>{groupKey}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {row?.pass ? <span style={{ color: "#16a34a" }}>✓</span> : <span style={{ color: "#b91c1c" }}>✕</span>}
                        <span style={{ fontSize: 10 }}>{isOpen ? "▼" : "▶"}</span>
                      </span>
                    </div>
                    {isOpen && row && (
                      <div style={{ padding: "8px 10px", fontSize: 10, fontFamily: "ui-monospace, monospace", borderTop: "1px solid #e5e7eb", background: "#fafafa" }}>
                        <div><strong>expected:</strong> {row.expected ?? "—"}</div>
                        <div><strong>resolved token:</strong> {displayValue(row.resolved)}</div>
                        <div><strong>final computed:</strong> {row.computed && Object.keys(row.computed).length > 0 ? Object.entries(row.computed).map(([k, v]) => `${k}: ${v}`).join("; ") : "—"}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {groups.map((gr) => (
            <div key={gr.groupKey}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => toggleGroup(gr.groupKey)}
                onKeyDown={(e) =>
                  (e.key === "Enter" || e.key === " ") && toggleGroup(gr.groupKey)
                }
                style={STYLES.groupHeader(gr.ok)}
              >
                <span style={{ fontSize: 10 }}>{expandedGroups[gr.groupKey] ? CHEVRON_DOWN : CHEVRON_RIGHT}</span>
                <span>{gr.groupKey}</span>
                <span>{gr.ok ? CHECK : CROSS}</span>
              </div>
              {expandedGroups[gr.groupKey] && (
                <div style={{ marginTop: 2 }}>
                  {gr.tokens.map((t, i) => {
                    const detail = tokenDetailsMap[t.path];
                    const computed = probeResults[t.path];
                    const isHover = hoverTokenKey === t.path;
                    const isSelected = selectedTokenKey === t.path;
                    return (
                      <div
                        key={i}
                        style={{
                          ...STYLES.tokenRow(t.ok),
                          ...(isSelected ? { background: "rgba(0,0,0,0.06)" } : {}),
                        }}
                        onMouseEnter={() => setHoverTokenKey(t.path)}
                        onMouseLeave={() => setHoverTokenKey(null)}
                        onClick={() => setSelectedTokenKey((k) => (k === t.path ? null : t.path))}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <span>{t.path} → {displayValue(t.value)} → {t.ok ? CHECK : CROSS}</span>
                          <span style={{ fontSize: 10, color: "#6b7280" }}>
                            expected: {getExpectedType(gr.groupKey)} · actual: {t.value === null ? "null" : typeof t.value}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); if (detail) setTokenTraceView({ keyPath: t.path, steps: detail.trace, resolved: detail.resolved, pass: detail.pass }); }}
                            style={{ padding: "2px 6px", fontSize: 10, borderRadius: 4, border: "1px solid #d1d5db", background: "#f9fafb", cursor: "pointer" }}
                          >
                            View Trace
                          </button>
                        </span>
                        {isHover && (
                          <div style={STYLES.tooltip(t.ok)}>
                            <div><strong>Input:</strong> {t.path}</div>
                            <div><strong>Resolved:</strong> {displayValue(detail?.resolved)}</div>
                            {computed && Object.keys(computed).length > 0 && (
                              <div><strong>Computed:</strong> {Object.entries(computed).map(([k, v]) => `${k}: ${v}`).join("; ")}</div>
                            )}
                            <div>{t.ok ? CHECK : CROSS} {t.ok ? "PASS" : "FAIL"}</div>
                          </div>
                        )}
                        {isSelected && detail && (
                          <div style={STYLES.detailPanel}>
                            {!detail.pass && firstFailingStep && (
                              <div style={STYLES.failBanner}>
                                FAIL at Step: {firstFailingStep.step} — output was {displayValue(firstFailingStep.output)}
                                {firstFailingStep.note && (
                                  <div style={{ marginTop: 4, fontWeight: 400, fontSize: 10 }}>
                                    {firstFailingStep.note}
                                  </div>
                                )}
                              </div>
                            )}
                            <div><strong>INPUT:</strong> {detail.key} → {displayValue(detail.expected)}</div>
                            <div><strong>OUTPUT:</strong> {displayValue(detail.resolved)} (type: {detail.resolved === null ? "null" : typeof detail.resolved})</div>
                            <div style={{ marginTop: 4 }}>
                              <button
                                type="button"
                                onClick={() => setTokenTraceView({ keyPath: detail.key, steps: detail.trace, resolved: detail.resolved, pass: detail.pass })}
                                style={{ padding: "2px 8px", fontSize: 10, borderRadius: 4, border: "1px solid #d1d5db", background: "#f9fafb", cursor: "pointer" }}
                              >
                                View Trace in panel
                              </button>
                            </div>
                            {computed && Object.keys(computed).length > 0 && (
                              <div><strong>COMPUTED:</strong> {Object.entries(computed).map(([k, v]) => `${k}: ${v}`).join("; ")}</div>
                            )}
                            {(!computed || Object.keys(computed).length === 0) && (
                              <div style={{ color: "#6b6e76" }}>COMPUTED: (click Run Probes)</div>
                            )}
                            <div style={{ marginTop: 6 }}><strong>TRACE:</strong></div>
                            {detail.trace.map((step: TraceStep, j: number) => (
                              <div key={j} style={STYLES.traceRow(step.ok)}>
                                {step.ok ? CHECK : CROSS} {step.step}: in={displayValue(step.input)} → out={displayValue(step.output)}
                                {step.note && <div style={{ marginLeft: 12, fontSize: 10 }}>{step.note}</div>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
