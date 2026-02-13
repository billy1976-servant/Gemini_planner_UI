/**
 * Palette Contract Inspector — read-only dropdown at top of Palette sidebar.
 * Global PASS/FAIL, expandable groups, per-token drilldown with trace and DOM probes.
 * No engine changes.
 */

"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  screen: string;
  layout: string;
  section: string;
  molecule: string;
  atom: string;
  jsonPath: string;
  /** Provenance: from data-render-source ("json" | "shell") or undefined = unknown. */
  renderSource?: "json" | "shell";
  /** When renderSource is "json": screenId from nearest data-render-source="json" ancestor. */
  screenIdFromRender?: string;
  /** When renderSource is "json": jsonPath from that ancestor. */
  jsonPathFromRender?: string;
  /** When renderSource is "shell": data-shell-layer value. */
  originLayer?: string;
  /** Resolved display: "JSON" | "SHELL" | "unknown". */
  originType?: "JSON" | "SHELL" | "unknown";
  tsxSource?: string;
};

type ElementType = "text" | "svg" | "img" | "button" | "container";

type IconInfo =
  | { kind: "img"; src: string; naturalWidth: number; naturalHeight: number }
  | { kind: "svg"; inline: true; viewBox: string; width: string; height: string }
  | null;

function collectOriginTrace(el: HTMLElement): OriginTrace {
  const out: OriginTrace = {
    screen: "unknown",
    layout: "unknown",
    section: "unknown",
    molecule: "unknown",
    atom: "unknown",
    jsonPath: "unknown",
  };
  let tsxSource = "";
  let tsxLayer = "";
  let nearestRenderSource: "json" | "shell" | undefined;
  let shellLayerFromRender = "";
  let screenIdFromRender = "";
  let jsonPathFromRender = "";
  let node: Element | null = el;
  while (node && node !== document.body) {
    const d = "dataset" in node ? (node as HTMLElement).dataset : ({} as Record<string, string>);
    const dAny = d as Record<string, string>;
    if (nearestRenderSource === undefined && dAny.renderSource) {
      nearestRenderSource = dAny.renderSource === "shell" ? "shell" : dAny.renderSource === "json" ? "json" : undefined;
      if (nearestRenderSource === "shell" && dAny.shellLayer) shellLayerFromRender = String(dAny.shellLayer);
      if (nearestRenderSource === "json") {
        if (dAny.screenId) screenIdFromRender = String(dAny.screenId);
        if (dAny.jsonPath) jsonPathFromRender = String(dAny.jsonPath);
      }
    }
    if (out.screen === "unknown" && d.screen) out.screen = String(d.screen);
    if (out.layout === "unknown" && d.layout) out.layout = String(d.layout);
    if (out.section === "unknown" && d.section) out.section = String(d.section);
    if (out.molecule === "unknown" && d.molecule) out.molecule = String(d.molecule);
    if (out.atom === "unknown" && d.atom) out.atom = String(d.atom);
    if (out.jsonPath === "unknown" && d.jsonPath) out.jsonPath = String(d.jsonPath);
    if (!tsxSource && dAny.tsxSource) tsxSource = String(dAny.tsxSource);
    if (!tsxLayer && dAny.tsxLayer) tsxLayer = String(dAny.tsxLayer);
    node = node.parentElement;
  }
  out.renderSource = nearestRenderSource;
  if (nearestRenderSource === "json") {
    out.originType = "JSON";
    if (screenIdFromRender) out.screenIdFromRender = screenIdFromRender;
    if (jsonPathFromRender) out.jsonPathFromRender = jsonPathFromRender;
  } else if (nearestRenderSource === "shell") {
    out.originType = "SHELL";
    out.originLayer = shellLayerFromRender || "shell";
  } else {
    out.originType = "unknown";
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
    componentOriginFound: originTrace.originType === "JSON" || originTrace.originType === "SHELL",
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
  paletteName?: string;
  pipelineContext?: { screenId?: string; layoutId?: string; deviceMode?: string };
};

export type ProbeResultRow = {
  pass: boolean;
  expected?: string;
  resolved?: unknown;
  computed?: Record<string, string>;
};

const ROLE_LIKE_GROUPS = ["textRole", "surfaceTier", "prominence", "interaction"];

export default function PaletteContractInspector({ palette, paletteName, pipelineContext }: PaletteContractInspectorProps) {
  const [inspectMode, setInspectMode] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [expandedProbeRows, setExpandedProbeRows] = useState<Record<string, boolean>>({});
  const [selectedTokenKey, setSelectedTokenKey] = useState<string | null>(null);
  const [hoverTokenKey, setHoverTokenKey] = useState<string | null>(null);
  const [probeResults, setProbeResults] = useState<Record<string, Record<string, string>>>({});
  const [paletteProbeResults, setPaletteProbeResults] = useState<Record<string, ProbeResultRow> | null>(null);
  const [hoverDiagnostic, setHoverDiagnostic] = useState<HoverDiagnostic | null>(null);
  const [pinnedDiagnostic, setPinnedDiagnostic] = useState<HoverDiagnostic | null>(null);
  const [panelReportCopied, setPanelReportCopied] = useState(false);
  const [panelOffset, setPanelOffset] = useState({ x: 0, y: 0 });
  const [panelPinPos, setPanelPinPos] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingPanel, setIsDraggingPanel] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });
  const [reportCopied, setReportCopied] = useState(false);
  const probeHostRef = useRef<TokenProbeHostRef>(null);
  const lastOutlinedRef = useRef<HTMLElement | null>(null);
  const lastHoverRunRef = useRef(0);
  const pinnedRef = useRef<HoverDiagnostic | null>(null);
  const pinnedElementRef = useRef<HTMLElement | null>(null);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const HOVER_THROTTLE_MS = 60;
  pinnedRef.current = pinnedDiagnostic;

  const { globalOk, groups } = useMemo(() => computeInspection(palette), [palette]);

  useEffect(() => {
    if (!inspectMode) {
      setHoverDiagnostic(null);
      setPinnedDiagnostic(null);
      setPanelPinPos(null);
      setHighlightRect(null);
      pinnedRef.current = null;
      pinnedElementRef.current = null;
      if (lastOutlinedRef.current) {
        lastOutlinedRef.current.style.outline = "";
        lastOutlinedRef.current = null;
      }
      return;
    }
    const onMove = (e: MouseEvent) => {
      if (pinnedRef.current) return;
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
        setHighlightRect(null);
        return;
      }
      const diag = buildHoverDiagnostic(el, palette);
      setHoverDiagnostic(diag);
      setHighlightRect(el.getBoundingClientRect());
      const anyFail = diag && Object.values(diag.statuses).some((v) => !v);
      el.style.outline = anyFail ? "2px solid #dc2626" : "2px solid #22c55e";
      lastOutlinedRef.current = el;
    };
    const onClick = (e: MouseEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (!el) return;
      const htmlEl = el instanceof HTMLElement ? el : null;
      const diag = htmlEl ? buildHoverDiagnostic(htmlEl, palette) : null;
      if (diag) {
        setPinnedDiagnostic(diag);
        pinnedRef.current = diag;
        pinnedElementRef.current = htmlEl;
        setPanelPinPos({ x: e.clientX, y: e.clientY });
        setHighlightRect(htmlEl.getBoundingClientRect());
      }
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
        originType: diag?.originTrace.originType,
        renderSource: diag?.originTrace.renderSource,
        screen: diag?.originTrace.screenIdFromRender ?? diag?.originTrace.screen ?? "unknown",
        jsonPath: diag?.originTrace.jsonPathFromRender ?? diag?.originTrace.jsonPath ?? "unknown",
        section: diag?.originTrace.section ?? "unknown",
        molecule: diag?.originTrace.molecule ?? "unknown",
        atom: diag?.originTrace.atom ?? "unknown",
        shellLayer: diag?.originTrace.originLayer,
        computedStyle,
        iconInfo: diag?.iconInfo ?? null,
      });
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPinnedDiagnostic(null);
        setPanelPinPos(null);
        pinnedRef.current = null;
        pinnedElementRef.current = null;
        setHighlightRect(null);
      }
    };
    const updateHighlightFromTarget = () => {
      const target = pinnedElementRef.current ?? lastOutlinedRef.current;
      if (target && document.contains(target)) {
        setHighlightRect(target.getBoundingClientRect());
      } else if (!pinnedRef.current) {
        setHighlightRect(null);
      }
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", updateHighlightFromTarget, true);
    window.addEventListener("resize", updateHighlightFromTarget);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", updateHighlightFromTarget, true);
      window.removeEventListener("resize", updateHighlightFromTarget);
      setHoverDiagnostic(null);
      setHighlightRect(null);
      if (lastOutlinedRef.current) {
        lastOutlinedRef.current.style.outline = "";
        lastOutlinedRef.current = null;
      }
    };
  }, [inspectMode, palette]);

  useEffect(() => {
    if (!isDraggingPanel) return;
    const onMouseMove = (e: MouseEvent) => {
      const { x, y, offsetX, offsetY } = dragStartRef.current;
      setPanelOffset({ x: offsetX + (e.clientX - x), y: offsetY + (e.clientY - y) });
    };
    const onMouseUp = () => setIsDraggingPanel(false);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [isDraggingPanel]);

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
    const palName = paletteName ?? "current";
    const screenId = pipelineContext?.screenId ?? "unknown";
    const layoutId = pipelineContext?.layoutId ?? "unknown";
    const deviceMode = pipelineContext?.deviceMode ?? "Desktop";
    const originDiag = pinnedDiagnostic ?? hoverDiagnostic;

    const lines: string[] = [
      "PIPELINE CONTEXT:",
      `- active palette: ${palName}`,
      `- screen id: ${screenId}`,
      `- layout id: ${layoutId}`,
      `- device mode: ${deviceMode}`,
      "- renderer: JsonRenderer",
      `- timestamp: ${new Date().toISOString()}`,
      "",
      "--------------",
      "",
    ];

    const contractKeys: { path: string; ok: boolean; groupKey: string; tokenKey: string }[] = [];
    for (const gr of groups) {
      for (const t of gr.tokens) {
        contractKeys.push({ path: t.path, ok: t.ok, groupKey: gr.groupKey, tokenKey: t.path.split(".")[1] ?? "" });
      }
    }
    const total = contractKeys.length;
    const passCount = contractKeys.filter((c) => c.ok).length;
    const failCount = total - passCount;

    lines.push("SUMMARY:");
    lines.push(`- total checks: ${total}`);
    lines.push(`- pass: ${passCount}`);
    lines.push(`- fail: ${failCount}`);
    lines.push("");

    const passKeys = contractKeys.filter((c) => c.ok).map((c) => c.path);
    const failKeys = contractKeys.filter((c) => !c.ok);

    lines.push("PASS KEYS (compact):");
    lines.push(passKeys.length > 0 ? passKeys.join(" ") : "(none)");
    lines.push("");

    lines.push("FAIL KEYS (expanded below):");
    lines.push("");

    for (const { path, groupKey, tokenKey } of failKeys) {
      const detail = tokenDetailsMap[path];
      const computed = probeResults[path] ?? paletteProbeResults?.[groupKey]?.computed;
      const isRoleLike = ROLE_LIKE_GROUPS.includes(groupKey);

      lines.push(`---- ${path} ----`);
      lines.push("STATUS: FAIL");
      lines.push(`KEY: ${path}`);
      lines.push("");

      if (groupKey === "textRole" && tokenKey && palette?.textRole?.[tokenKey]) {
        const roleDef = palette.textRole[tokenKey] as Record<string, string> | undefined;
        const exp = getTextRoleExpected(palette, tokenKey);
        const expectedParts: string[] = [];
        if (roleDef?.size) expectedParts.push(`size=${roleDef.size}`);
        if (roleDef?.weight) expectedParts.push(`weight=${roleDef.weight}`);
        if (roleDef?.lineHeight) expectedParts.push(`lineHeight=${roleDef.lineHeight}`);
        if (roleDef?.color) expectedParts.push(`color=${roleDef.color}`);
        lines.push(`Expected tokens: ${expectedParts.join(" ") || "—"}`);
        const actualParts: string[] = [];
        if (exp?.size != null) actualParts.push(`size=${exp.size}`);
        if (exp?.weight != null) actualParts.push(`weight=${exp.weight}`);
        if (exp?.lineHeight != null) actualParts.push(`lineHeight=${exp.lineHeight}`);
        if (exp?.color != null) actualParts.push(`color=${exp.color}`);
        lines.push(`Actual tokens:   ${actualParts.join(" ") || "—"}`);
      } else {
        const tokenRow = groups.flatMap((g) => g.tokens).find((t) => t.path === path);
        lines.push(`Expected: ${displayValue(tokenRow?.value ?? detail?.expected)}`);
        lines.push(`Actual: ${displayValue(detail?.resolved)}`);
      }
      lines.push("");

      lines.push("Resolved:");
      if (computed && Object.keys(computed).length > 0) {
        ["fontSize", "fontWeight", "lineHeight", "color"].forEach((k) => {
          if (computed[k] != null) lines.push(`- ${k}: ${computed[k]}`);
        });
        if (Object.keys(computed).filter((k) => !["fontSize", "fontWeight", "lineHeight", "color"].includes(k)).length > 0) {
          Object.entries(computed).forEach(([k, v]) => {
            if (!["fontSize", "fontWeight", "lineHeight", "color"].includes(k)) lines.push(`- ${k}: ${v}`);
          });
        }
      } else {
        lines.push("- (run probes for computed values)");
      }
      lines.push("");

      const diffLines: string[] = [];
      if (isRoleLike && tokenKey && detail) {
        const exp = getTextRoleExpected(palette, tokenKey);
        const actualSize = computed?.fontSize != null ? parsePx(computed.fontSize) : null;
        const expSize = exp?.size != null ? parsePx(exp.size + "px") ?? parseFloat(exp.size) : null;
        if (expSize != null && actualSize != null && Math.abs(expSize - actualSize) >= 2) diffLines.push("fontSize mismatch");
        const actualWeight = computed?.fontWeight != null ? (parseFloat(computed.fontWeight) || (computed.fontWeight === "bold" ? 700 : 400)) : null;
        const expWeight = exp?.weight != null ? parseFloat(exp.weight) : null;
        if (expWeight != null && actualWeight != null && Math.abs(expWeight - actualWeight) >= 50) diffLines.push("fontWeight mismatch");
        const actualLh = computed?.lineHeight != null ? parseFloat(computed.lineHeight) : null;
        const expLh = exp?.lineHeight != null ? parseFloat(exp.lineHeight) : null;
        if (expLh != null && actualLh != null && !Number.isNaN(actualLh) && Math.abs(expLh - actualLh) >= 0.15) diffLines.push("lineHeight mismatch");
        if (computed?.color && exp?.color && (computed.color?.replace(/\s/g, "") !== exp.color?.replace(/\s/g, ""))) diffLines.push("color mismatch");
      } else if (detail && !detail.pass) {
        diffLines.push("token resolution mismatch");
      }
      if (diffLines.length === 0 && !detail?.pass) diffLines.push("token or value mismatch");
      lines.push("Diff:");
      diffLines.forEach((d) => lines.push(`✗ ${d}`));
      lines.push("");

      lines.push("Origin:");
      lines.push(`- palette: ${palName}`);
      if (originDiag?.originTrace.originType === "JSON") {
        lines.push(`- Origin: JSON`);
        lines.push(`- screen: ${originDiag.originTrace.screenIdFromRender ?? originDiag.originTrace.screen ?? "unknown"}`);
        lines.push(`- jsonPath: ${originDiag.originTrace.jsonPathFromRender ?? originDiag.originTrace.jsonPath ?? "unknown"}`);
        lines.push(`- section: ${originDiag.originTrace.section ?? "unknown"}`);
        lines.push(`- molecule: ${originDiag.originTrace.molecule ?? "unknown"}`);
        lines.push(`- atom: ${originDiag.originTrace.atom ?? "unknown"}`);
      } else if (originDiag?.originTrace.originType === "SHELL") {
        lines.push(`- Origin: shell`, `- Layer: ${originDiag.originTrace.originLayer ?? "—"}`);
      } else {
        lines.push(`- Origin: unknown`);
      }
      lines.push("");
    }

    if (failKeys.length === 0) {
      lines.push("(No failures)");
    }

    return lines.join("\n").replace(/\n\n+$/, "\n");
  }

  const selectedDetail = selectedTokenKey ? tokenDetailsMap[selectedTokenKey] : null;
  const firstFailingStep = selectedDetail?.trace?.find((s) => !s.ok);

  function buildFloatingPanelReport(d: HoverDiagnostic): string {
    const palName = paletteName ?? "current";
    const lines: string[] = [
      "PIPELINE CONTEXT:",
      `- active palette: ${palName}`,
      `- screen id: ${pipelineContext?.screenId ?? "unknown"}`,
      `- layout id: ${pipelineContext?.layoutId ?? "unknown"}`,
      `- device mode: ${pipelineContext?.deviceMode ?? "Desktop"}`,
      "- renderer: JsonRenderer",
      `- timestamp: ${new Date().toISOString()}`,
      "",
      "--------------",
      "",
      "---- " + d.elementLabel + " ----",
      `STATUS: ${d.statusFlags.palettePass && Object.values(d.statuses).every(Boolean) ? "PASS" : "FAIL"}`,
      `KEY: ${d.elementLabel}`,
      "",
      `Expected tokens: size=${d.expected.size} weight=${d.expected.weight} lineHeight=${d.expected.lineHeight}`,
      `Actual tokens:   size=${d.actual.size} weight=${d.actual.weight} lineHeight=${d.actual.lineHeight}`,
      "",
      "Resolved:",
      `- fontSize: ${d.actual.size}`,
      `- fontWeight: ${d.actual.weight}`,
      `- lineHeight: ${d.actual.lineHeight}`,
      `- color: ${d.actual.color ?? "—"}`,
      "",
      "Diff:",
    ];
    const diffLines: string[] = [];
    if (!d.statuses.size) diffLines.push("✗ fontSize mismatch");
    if (!d.statuses.weight) diffLines.push("✗ fontWeight mismatch");
    if (!d.statuses.lineHeight) diffLines.push("✗ lineHeight mismatch");
    if (!d.statuses.color) diffLines.push("✗ color mismatch");
    if (d.tokenNotFound) diffLines.push("✗ token mismatch");
    if (diffLines.length === 0) diffLines.push("(none)");
    lines.push(...diffLines, "", "Origin:", `- palette: ${palName}`);
    if (d.originTrace.originType === "JSON") {
      lines.push(`- Origin: JSON`, `- screen: ${d.originTrace.screenIdFromRender ?? d.originTrace.screen}`, `- jsonPath: ${d.originTrace.jsonPathFromRender ?? d.originTrace.jsonPath}`);
      lines.push(`- section: ${d.originTrace.section}`, `- molecule: ${d.originTrace.molecule}`, `- atom: ${d.originTrace.atom}`);
    } else if (d.originTrace.originType === "SHELL") {
      lines.push(`- Origin: shell`, `- Layer: ${d.originTrace.originLayer ?? "—"}`);
    } else {
      lines.push(`- Origin: unknown`);
    }
    return lines.join("\n");
  }

  const displayDiagnostic = pinnedDiagnostic ?? hoverDiagnostic;
  const PANEL_WIDTH = 300;
  const PANEL_HEIGHT_ESTIMATE = 320;
  const PANEL_FLIP_THRESHOLD = typeof window !== "undefined" ? Math.min(PANEL_HEIGHT_ESTIMATE, window.innerHeight * 0.5) : PANEL_HEIGHT_ESTIMATE;

  return (
    <div style={{ marginBottom: 10 }}>
      {inspectMode && highlightRect &&
        createPortal(
          <div
            aria-hidden
            style={{
              position: "fixed",
              left: highlightRect.left,
              top: highlightRect.top,
              width: highlightRect.width,
              height: highlightRect.height,
              border: "2px solid #3B82F6",
              background: "rgba(59, 130, 246, 0.08)",
              pointerEvents: "none",
              zIndex: 999999,
              boxSizing: "border-box",
            }}
          />,
          document.body
        )}
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

      {inspectMode && displayDiagnostic && (() => {
        const rect = displayDiagnostic.rect;
        const usePinPos = pinnedDiagnostic && panelPinPos;
        const anchorX = usePinPos ? panelPinPos.x : rect.right + 8;
        const anchorY = usePinPos ? panelPinPos.y : rect.top;
        const spaceBelow = typeof window !== "undefined" ? window.innerHeight - anchorY : 400;
        const flipUp = spaceBelow < PANEL_FLIP_THRESHOLD;
        let left = anchorX + 12 + panelOffset.x;
        if (typeof window !== "undefined") left = Math.min(left, window.innerWidth - PANEL_WIDTH - 8);
        left = Math.max(8, left);
        let top: number | undefined;
        let bottom: number | undefined;
        if (flipUp) {
          bottom = (typeof window !== "undefined" ? window.innerHeight - anchorY + 12 : 400) - panelOffset.y;
          bottom = Math.max(8, Math.min(bottom, typeof window !== "undefined" ? window.innerHeight - 8 : 400));
        } else {
          top = anchorY + 12 + panelOffset.y;
          top = Math.max(8, Math.min(top, typeof window !== "undefined" ? window.innerHeight - PANEL_HEIGHT_ESTIMATE - 8 : 400));
        }
        return (
          <div
            style={{
              position: "fixed",
              left,
              ...(flipUp ? { bottom } : { top }),
              width: PANEL_WIDTH,
              maxWidth: "90vw",
              maxHeight: "65vh",
              padding: "10px 12px",
              fontSize: 11,
              fontFamily: "ui-monospace, SF Mono, Menlo, monospace",
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
              zIndex: 10000,
              pointerEvents: pinnedDiagnostic ? "auto" : "none",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {pinnedDiagnostic && (
              <div
                role="button"
                tabIndex={0}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setIsDraggingPanel(true);
                  dragStartRef.current = { x: e.clientX, y: e.clientY, offsetX: panelOffset.x, offsetY: panelOffset.y };
                }}
                style={{
                  cursor: "move",
                  padding: "4px 0",
                  marginBottom: 4,
                  borderBottom: "1px solid #e5e7eb",
                  userSelect: "none",
                  fontSize: 10,
                  color: "#6b7280",
                }}
                title="Drag to move panel"
              >
                ⋮⋮ Drag to move
              </div>
            )}
            {pinnedDiagnostic && (
              <div style={{ fontWeight: 700, fontSize: 11, marginBottom: 6, color: "#111" }}>[ PINNED ] {displayDiagnostic.elementLabel}</div>
            )}
            <div style={{ display: "flex", gap: 6, marginBottom: 6, flexShrink: 0 }}>
              {pinnedDiagnostic ? (
                <button
                  type="button"
                  onClick={() => { setPinnedDiagnostic(null); pinnedRef.current = null; setPanelPinPos(null); setPanelOffset({ x: 0, y: 0 }); }}
                  style={{ padding: "2px 8px", fontSize: 10, cursor: "pointer", border: "1px solid #d1d5db", borderRadius: 4, background: "#f3f4f6" }}
                >
                  Unpin
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => { setPinnedDiagnostic(displayDiagnostic); pinnedRef.current = displayDiagnostic; }}
                  style={{ padding: "2px 8px", fontSize: 10, cursor: "pointer", border: "1px solid #22c55e", borderRadius: 4, background: "rgba(34,197,94,0.1)", color: "#16a34a" }}
                >
                  Pin
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  const report = buildFloatingPanelReport(displayDiagnostic);
                  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
                    navigator.clipboard.writeText(report).then(
                      () => { setPanelReportCopied(true); setTimeout(() => setPanelReportCopied(false), 2000); },
                      () => setPanelReportCopied(false),
                    );
                  }
                }}
                style={{ padding: "2px 8px", fontSize: 10, cursor: "pointer", border: "1px solid #d1d5db", borderRadius: 4, background: "#f3f4f6" }}
              >
                {panelReportCopied ? "Copied" : "Copy Report"}
              </button>
            </div>
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
              <div style={{ fontWeight: 700, marginBottom: 6, color: "#111" }}>Element: {displayDiagnostic.elementLabel}</div>
              {displayDiagnostic.tokenNotFound && (
                <div style={{ marginBottom: 6, padding: "4px 6px", background: "#fef2f2", color: "#b91c1c", borderRadius: 4 }}>
                  TOKEN NOT FOUND → {displayDiagnostic.tokenNotFound}
                </div>
              )}
              <div style={{ marginBottom: 4 }}><strong>EXPECTED:</strong></div>
              <div style={{ marginLeft: 8, marginBottom: 6 }}>
                size → {displayDiagnostic.expected.size} weight → {displayDiagnostic.expected.weight} lineHeight → {displayDiagnostic.expected.lineHeight}
              </div>
              <div style={{ marginBottom: 4 }}><strong>ACTUAL:</strong></div>
              <div style={{ marginLeft: 8, marginBottom: 8 }}>
                size → {displayDiagnostic.actual.size} weight → {displayDiagnostic.actual.weight} lineHeight → {displayDiagnostic.actual.lineHeight}
              </div>
              <div style={{ marginBottom: 4 }}><strong>STATUS:</strong></div>
              <div style={{ marginLeft: 8 }}>
                {displayDiagnostic.statuses.size ? <span style={{ color: "#16a34a" }}>✔ SIZE OK</span> : <span style={{ color: "#dc2626" }}>✖ SIZE MISMATCH</span>}
                {" "}
                {displayDiagnostic.statuses.weight ? <span style={{ color: "#16a34a" }}>✔ WEIGHT OK</span> : <span style={{ color: "#dc2626" }}>✖ WEIGHT MISMATCH</span>}
                {" "}
                {displayDiagnostic.statuses.lineHeight ? <span style={{ color: "#16a34a" }}>✔ LINE-HEIGHT OK</span> : <span style={{ color: "#dc2626" }}>✖ LINE-HEIGHT MISMATCH</span>}
                <br />
                {displayDiagnostic.statuses.color ? <span style={{ color: "#16a34a" }}>✔ COLOR OK</span> : <span style={{ color: "#dc2626" }}>✖ COLOR MISMATCH</span>}
                <br />
                {displayDiagnostic.statusFlags.tokenResolved ? <span style={{ color: "#16a34a" }}>✔ token resolved</span> : <span style={{ color: "#dc2626" }}>✖ token unresolved</span>}
                {displayDiagnostic.statusFlags.textRoleMatch ? <span style={{ color: "#16a34a" }}> ✔ textRole match</span> : (displayDiagnostic.elementLabel !== "element" ? <span style={{ color: "#dc2626" }}> ✖ textRole mismatch</span> : null)}
                {displayDiagnostic.statusFlags.resolverKnown ? <span style={{ color: "#16a34a" }}> ✔ resolver known</span> : <span style={{ color: "#dc2626" }}> ✖ missing resolver</span>}
                <br />
                {displayDiagnostic.statusFlags.palettePass ? <span style={{ color: "#16a34a" }}>✔ palette PASS</span> : <span style={{ color: "#dc2626" }}>✖ palette FAIL</span>}
                {displayDiagnostic.statusFlags.componentOriginFound ? <span style={{ color: "#16a34a" }}> ✔ component origin found</span> : <span style={{ color: "#dc2626" }}> ✖ component unknown</span>}
                {displayDiagnostic.statusFlags.moleculeKnown ? <span style={{ color: "#16a34a" }}> ✔ molecule known</span> : <span style={{ color: "#dc2626" }}> ✖ molecule unknown</span>}
              </div>
              <div style={{ marginTop: 8, paddingTop: 6, borderTop: "1px solid #e5e7eb", fontSize: 10, color: "#374151" }}>
                <strong>Element Type:</strong> {displayDiagnostic.elementType}
              </div>
              {displayDiagnostic.iconInfo && (
                <div style={{ marginTop: 4, fontSize: 10, color: "#374151" }}>
                  {displayDiagnostic.iconInfo.kind === "img" && (
                    <>
                      <strong>IMG:</strong> src → {displayDiagnostic.iconInfo.src.length > 40 ? displayDiagnostic.iconInfo.src.slice(0, 40) + "…" : displayDiagnostic.iconInfo.src}
                      <br />
                      naturalWidth × naturalHeight → {displayDiagnostic.iconInfo.naturalWidth} × {displayDiagnostic.iconInfo.naturalHeight}
                    </>
                  )}
                  {displayDiagnostic.iconInfo.kind === "svg" && (
                    <>
                      <strong>SVG:</strong> inline svg = true
                      <br />
                      viewBox → {displayDiagnostic.iconInfo.viewBox} | width × height → {displayDiagnostic.iconInfo.width} × {displayDiagnostic.iconInfo.height}
                    </>
                  )}
                </div>
              )}
              <div style={{ marginTop: 8, paddingTop: 6, borderTop: "1px solid #e5e7eb", fontSize: 10, color: "#374151" }}>
                <strong>RENDER ORIGIN</strong>
                {displayDiagnostic.originTrace.originType === "JSON" && (
                  <>
                    <div style={{ marginLeft: 4, marginTop: 2 }}>Origin: JSON</div>
                    <div style={{ marginLeft: 4 }}>Screen: {displayDiagnostic.originTrace.screenIdFromRender || displayDiagnostic.originTrace.screen}</div>
                    <div style={{ marginLeft: 4 }}>JSON path: {displayDiagnostic.originTrace.jsonPathFromRender || displayDiagnostic.originTrace.jsonPath}</div>
                    <div style={{ marginLeft: 4 }}>Section: {displayDiagnostic.originTrace.section}</div>
                    <div style={{ marginLeft: 4 }}>Molecule: {displayDiagnostic.originTrace.molecule}</div>
                    <div style={{ marginLeft: 4 }}>Atom: {displayDiagnostic.originTrace.atom}</div>
                  </>
                )}
                {displayDiagnostic.originTrace.originType === "SHELL" && (
                  <>
                    <div style={{ marginLeft: 4, marginTop: 2 }}>Origin: shell</div>
                    <div style={{ marginLeft: 4 }}>Layer: {displayDiagnostic.originTrace.originLayer ?? "—"}</div>
                  </>
                )}
                {displayDiagnostic.originTrace.originType === "unknown" && (
                  <div style={{ marginLeft: 4, marginTop: 2 }}>Origin: unknown</div>
                )}
              </div>
              <div style={{ marginTop: 6, paddingTop: 6, borderTop: "1px solid #e5e7eb", fontSize: 10, color: "#6b7280" }}>
                <strong>STYLE PIPELINE</strong>
                <div style={{ marginLeft: 4, marginTop: 2 }}>Token source: {displayDiagnostic.elementLabel}</div>
                <div style={{ marginLeft: 4 }}>Resolver used: {displayDiagnostic.resolverHint}</div>
                <div style={{ marginLeft: 4 }}>Final computedStyle: {Object.entries(displayDiagnostic.actual).slice(0, 4).map(([k, v]) => `${k}=${v}`).join("; ")}…</div>
              </div>
              <div style={{ marginTop: 6, fontSize: 10, color: "#6b7280" }}>
                {displayDiagnostic.pipeline.map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

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
