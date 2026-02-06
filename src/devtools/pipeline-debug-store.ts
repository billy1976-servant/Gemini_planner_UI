"use client";
/**
 * Central debug store for live pipeline state inspection.
 * Observes interaction, behavior, state, visibility, layout, and render layers.
 * Only written by observers; no business logic.
 */

import type { RendererTraceEvent } from "@/engine/debug/renderer-trace";
import { recordStage } from "@/engine/debug/pipelineStageTrace";

if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  (window as any).__PIPELINE_DEBUG_STORE__ = true;
}

export type ResolutionChainEntry = {
  source: string;
  found?: boolean;
  value?: string;
  used?: boolean;
};

export type SectionRenderRow = {
  sectionId: string;
  visible: boolean;
  layoutRequested?: string | null;
  layoutResolved: string;
  cardMoleculeType?: string;
  controlledByStateKeys: string[];
  resolutionChain?: ResolutionChainEntry[];
};

export type JsonRendererPropsSnapshot = {
  sectionLayoutPresetOverrides: Record<string, string>;
  cardLayoutPresetOverrides: Record<string, string>;
  organInternalLayoutOverrides: Record<string, string>;
  screenId: string | null;
};

export type LayoutChangeEntry = {
  sectionId: string;
  prevLayout: string;
  nextLayout: string;
  reason?: string;
};

export type StateDiffEntry = {
  key: string;
  prev: unknown;
  curr: unknown;
};

export type LastInteraction = {
  time: number;
  type: string;
  target: string;
};

export type DeadInteractionDetails = {
  interaction: LastInteraction;
  reason: string;
};

export type BeforeSnapshot = {
  stateValues: Record<string, unknown> | undefined;
  layoutMap: Record<string, string>;
};

export type ResolverInputSnapshot = {
  sectionKey: string;
  overrideLayout?: string;
  nodeLayout?: string;
  finalChosenLayout?: string;
};

export type ContractTestStepResult = {
  step: string;
  pass: boolean;
  reason?: string;
};

export type ContractTestResult = {
  passed: boolean;
  results: ContractTestStepResult[];
  failureReason?: string;
};

export type PipelineDebugMark = {
  ts: number;
  stage: string;
  label: string;
  data?: unknown;
  stack?: string;
};

export type PipelineDebugSnapshot = {
  lastEvent: LastInteraction | null;
  lastBehavior: any;
  lastAction: string | null;
  lastStateIntent: string | null;
  currentState: Record<string, any>;
  previousState: Record<string, any> | null;
  stateDiff: StateDiffEntry[];
  visibilityMap: Record<string, boolean>;
  layoutMap: Record<string, string>;
  previousLayoutMap: Record<string, string> | null;
  layoutChangeTrace: LayoutChangeEntry[];
  lastRenderRoot: string | null;
  sectionRenderRows: SectionRenderRow[];
  rendererTraceEvents: RendererTraceEvent[];
  jsonRendererPropsSnapshot: JsonRendererPropsSnapshot | null;
  beforeSnapshot: BeforeSnapshot | null;
  deadInteractionDetected: boolean;
  deadInteractionDetails: DeadInteractionDetails | null;
  resolverInputSnapshot: ResolverInputSnapshot | null;
  contractTestResults: ContractTestResult | null;
  /** Forensic breadcrumbs (file/line stack) — dev only */
  marks: PipelineDebugMark[];
};

const RENDERER_TRACE_CAP = 200;

const MARK_CAP = 100;

const initialState: PipelineDebugSnapshot = {
  lastEvent: null,
  lastBehavior: null,
  lastAction: null,
  lastStateIntent: null,
  currentState: {},
  previousState: null,
  stateDiff: [],
  visibilityMap: {},
  layoutMap: {},
  previousLayoutMap: null,
  layoutChangeTrace: [],
  lastRenderRoot: null,
  sectionRenderRows: [],
  rendererTraceEvents: [],
  jsonRendererPropsSnapshot: null,
  beforeSnapshot: null,
  deadInteractionDetected: false,
  deadInteractionDetails: null,
  resolverInputSnapshot: null,
  contractTestResults: null,
  marks: [],
};

let snapshot: PipelineDebugSnapshot = { ...initialState };
const listeners = new Set<() => void>();

/** During a render pass, we accumulate section rows keyed by id. */
let sectionRowsMap: Record<string, Partial<SectionRenderRow> & { sectionId: string }> = {};

function notify() {
  if (process.env.NODE_ENV !== "development") return;
  listeners.forEach((l) => l());
}

function computeStateDiff(prev: Record<string, any> | null, curr: Record<string, any>): StateDiffEntry[] {
  if (!curr) return [];
  const entries: StateDiffEntry[] = [];
  const seen = new Set<string>();
  for (const key of Object.keys(curr)) {
    seen.add(key);
    const currVal = curr[key];
    const prevVal = prev && key in prev ? prev[key] : undefined;
    if (key === "values" && currVal != null && typeof currVal === "object") {
      const prevValues = prev?.values ?? {};
      for (const vk of Object.keys(currVal)) {
        const pv = prevValues[vk];
        const cv = currVal[vk];
        if (pv !== cv) entries.push({ key: `values.${vk}`, prev: pv, curr: cv });
      }
    } else if (prevVal !== currVal) {
      entries.push({ key, prev: prevVal, curr: currVal });
    }
  }
  if (prev) {
    for (const key of Object.keys(prev)) {
      if (!seen.has(key) && prev[key] !== undefined) {
        entries.push({ key, prev: prev[key], curr: undefined });
      }
    }
  }
  return entries;
}

export const PipelineDebugStore = {
  getSnapshot(): PipelineDebugSnapshot {
    return snapshot;
  },

  subscribe(fn: () => void): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  setLastEvent(event: { time: number; type: string; target: string }) {
    if (process.env.NODE_ENV !== "development") return;
    snapshot = {
      ...snapshot,
      lastEvent: event,
      deadInteractionDetected: false,
      deadInteractionDetails: null,
    };
    notify();
  },

  setBeforeSnapshot(before: BeforeSnapshot | null) {
    if (process.env.NODE_ENV !== "development") return;
    snapshot = { ...snapshot, beforeSnapshot: before };
    notify();
  },

  getBeforeSnapshot(): BeforeSnapshot | null {
    return snapshot.beforeSnapshot ?? null;
  },

  setDeadInteraction(details: DeadInteractionDetails | null) {
    if (process.env.NODE_ENV !== "development") return;
    snapshot = {
      ...snapshot,
      deadInteractionDetected: details != null,
      deadInteractionDetails: details,
    };
    notify();
  },

  setLastBehavior(behavior: any) {
    if (process.env.NODE_ENV !== "development") return;
    snapshot = {
      ...snapshot,
      lastBehavior: behavior,
      lastAction: behavior?.params?.name ?? null,
    };
    notify();
  },

  setLastAction(actionName: string | null) {
    if (process.env.NODE_ENV !== "development") return;
    snapshot = { ...snapshot, lastAction: actionName };
    notify();
  },

  setLastStateIntent(intent: string, state: Record<string, any>) {
    if (process.env.NODE_ENV !== "development") return;
    const prev = snapshot.currentState;
    const nextState = state ?? {};
    const stateDiff = computeStateDiff(prev, nextState);
    snapshot = {
      ...snapshot,
      lastStateIntent: intent,
      previousState: prev && Object.keys(prev).length > 0 ? prev : snapshot.previousState,
      currentState: nextState,
      stateDiff,
    };
    notify();
  },

  setVisibility(nodeId: string, visible: boolean) {
    if (process.env.NODE_ENV !== "development") return;
    const visibilityMap = { ...(snapshot.visibilityMap ?? {}), [nodeId]: visible };
    snapshot = { ...snapshot, visibilityMap };
    notify();
  },

  setLayout(sectionId: string, resolvedLayoutId: string) {
    if (process.env.NODE_ENV !== "development") return;
    const layoutMap = { ...(snapshot.layoutMap ?? {}), [sectionId]: resolvedLayoutId };
    snapshot = { ...snapshot, layoutMap };
    notify();
  },

  setLastRenderRoot(rootNodeId: string | null) {
    if (process.env.NODE_ENV !== "development") return;
    snapshot = { ...snapshot, lastRenderRoot: rootNodeId };
    notify();
  },

  /** Start a render pass: clear section rows, capture previous layout map. */
  startRenderPass() {
    if (process.env.NODE_ENV !== "development") return;
    sectionRowsMap = {};
    snapshot = {
      ...snapshot,
      previousLayoutMap: snapshot.layoutMap && Object.keys(snapshot.layoutMap).length > 0 ? { ...snapshot.layoutMap } : null,
    };
    notify();
  },

  /** Record or merge a section/node render row (called from renderer during pass). */
  recordSectionRender(
    sectionId: string,
    partial: Partial<Omit<SectionRenderRow, "sectionId">> & { sectionId?: string }
  ) {
    if (process.env.NODE_ENV !== "development") return;
    const existing = sectionRowsMap[sectionId] ?? { sectionId, visible: true, layoutResolved: "", controlledByStateKeys: [] };
    sectionRowsMap[sectionId] = {
      ...existing,
      ...partial,
      sectionId,
      controlledByStateKeys:
        partial.controlledByStateKeys !== undefined ? partial.controlledByStateKeys : existing.controlledByStateKeys,
    };
  },

  /** Set JsonRenderer props snapshot (layout override props + screenId). Called from JsonRenderer. */
  setJsonRendererPropsSnapshot(props: JsonRendererPropsSnapshot) {
    if (process.env.NODE_ENV !== "development") return;
    snapshot = {
      ...snapshot,
      jsonRendererPropsSnapshot: {
        sectionLayoutPresetOverrides: { ...(props.sectionLayoutPresetOverrides ?? {}) },
        cardLayoutPresetOverrides: { ...(props.cardLayoutPresetOverrides ?? {}) },
        organInternalLayoutOverrides: { ...(props.organInternalLayoutOverrides ?? {}) },
        screenId: props.screenId ?? null,
      },
    };
    notify();
  },

  /** End render pass: freeze section rows array, compute layout change trace. */
  endRenderPass() {
    if (process.env.NODE_ENV !== "development") return;
    const sectionRenderRows: SectionRenderRow[] = Object.values(sectionRowsMap).map((row) => ({
      sectionId: row.sectionId,
      visible: row.visible ?? true,
      layoutRequested: row.layoutRequested ?? null,
      layoutResolved: row.layoutResolved ?? "",
      cardMoleculeType: row.cardMoleculeType,
      controlledByStateKeys: row.controlledByStateKeys ?? [],
      resolutionChain: row.resolutionChain ?? [],
    }));

    const layoutChangeTrace: LayoutChangeEntry[] = [...(snapshot.layoutChangeTrace ?? [])];
    const prevMap = snapshot.previousLayoutMap ?? {};
    const currMap = snapshot.layoutMap ?? {};
    for (const id of new Set([...Object.keys(prevMap), ...Object.keys(currMap)])) {
      const prevL = prevMap[id];
      const currL = currMap[id];
      if (prevL !== currL && (prevL != null || currL != null)) {
        layoutChangeTrace.push({
          sectionId: id,
          prevLayout: prevL ?? "—",
          nextLayout: currL ?? "—",
          reason: snapshot.lastStateIntent ? `state.${snapshot.lastStateIntent}` : "re-render",
        });
      }
    }
    const cap = 50;
    const trimmedTrace = layoutChangeTrace.slice(-cap);

    snapshot = {
      ...snapshot,
      sectionRenderRows,
      layoutChangeTrace: trimmedTrace,
      previousLayoutMap: null,
    };
    recordStage("render-pass", "pass", {
      sectionsRendered: Object.keys(snapshot.layoutMap ?? {}),
    });
    notify();
  },

  /** Clear layout change trace (optional, for UI). */
  clearLayoutChangeTrace() {
    if (process.env.NODE_ENV !== "development") return;
    snapshot = { ...snapshot, layoutChangeTrace: [] };
    notify();
  },

  /** Add a renderer trace event (from subscribeRendererTrace). */
  addRendererTraceEvent(event: RendererTraceEvent) {
    if (process.env.NODE_ENV !== "development") return;
    const events = [...(snapshot.rendererTraceEvents ?? []), event].slice(-RENDERER_TRACE_CAP);
    snapshot = { ...snapshot, rendererTraceEvents: events };
    notify();
  },

  /** Clear renderer trace (optional, for UI). */
  clearRendererTrace() {
    if (process.env.NODE_ENV !== "development") return;
    snapshot = { ...snapshot, rendererTraceEvents: [] };
    notify();
  },

  /** Set resolver input snapshot (sectionKey, override, node layout, final chosen). Called from JsonRenderer. */
  setResolverInputSnapshot(snap: ResolverInputSnapshot | null) {
    if (process.env.NODE_ENV !== "development") return;
    snapshot = { ...snapshot, resolverInputSnapshot: snap };
    notify();
  },

  /** Set layout contract test results (from pipelineContractTester). */
  setContractTestResults(results: ContractTestResult | null) {
    if (process.env.NODE_ENV !== "development") return;
    snapshot = { ...snapshot, contractTestResults: results };
    notify();
  },

  /** Forensic mark (stage, label, optional data + stack) — dev only. */
  mark(stage: string, label: string, data?: unknown) {
    if (process.env.NODE_ENV !== "development") return;
    let stack: string | undefined;
    try {
      const err = new Error();
      const lines = (err.stack ?? "").split("\n").slice(2, 12);
      stack = lines.join("\n").trim();
    } catch {
      stack = undefined;
    }
    const marks = [...(snapshot.marks ?? []), { ts: Date.now(), stage, label, data, stack }].slice(-MARK_CAP);
    snapshot = { ...snapshot, marks };
    notify();
  },
};

// Expose debug store to window for E2E contract tests
if (typeof window !== "undefined") {
  (window as any).__PIPELINE_DEBUG__ = {
    getSnapshot: () => PipelineDebugStore.getSnapshot(),
    getContractResults: () => PipelineDebugStore.getSnapshot().contractTestResults,
  };
}
