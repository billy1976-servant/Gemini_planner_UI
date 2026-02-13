/**
 * Shared tracing utility for pipeline diagnostics.
 * Enable/disable, record steps per element, getTraceByElementId, clear.
 * Used by inspector overlay and by instrumented resolveToken/resolveParams.
 */

export type TraceStepRecord = {
  label: string;
  in: unknown;
  out: unknown;
  meta?: Record<string, unknown>;
};

export type TraceError = {
  message: string;
  stepIndex: number;
};

export type TraceRecord = {
  ts: number;
  scope: string;
  elementId: string;
  screenPath: string;
  molecule: string;
  prop?: string;
  tokenPath?: string;
  steps: TraceStepRecord[];
  status: "pass" | "fail";
  error?: TraceError;
  computedStyles?: Record<string, string>;
};

type TraceContext = {
  elementId: string;
  screenPath: string;
  molecule: string;
  steps: TraceStepRecord[];
  status: "pass" | "fail";
  error?: TraceError;
};

let enabled = false;
let currentContext: TraceContext | null = null;
const tracesByElementId = new Map<string, TraceRecord>();

export function setEnabled(value: boolean): void {
  enabled = value;
  if (!value) currentContext = null;
}

export function isEnabled(): boolean {
  return enabled;
}

export function startTrace(scope: string, elementId: string, screenPath: string, molecule: string): void {
  if (!enabled) return;
  currentContext = {
    elementId,
    screenPath,
    molecule,
    steps: [],
    status: "pass",
  };
}

export function recordStep(step: TraceStepRecord): void {
  if (!enabled || !currentContext) return;
  currentContext.steps.push(step);
  const out = step.out;
  const isBad =
    out === undefined ||
    out === null ||
    (typeof out === "object" && Array.isArray(out) === false);
  if (isBad && currentContext.status === "pass") {
    currentContext.status = "fail";
    currentContext.error = {
      message: typeof out === "object" ? "Non-primitive (object)" : out === undefined ? "undefined" : "null",
      stepIndex: currentContext.steps.length - 1,
    };
  }
}

export function endTrace(prop?: string, tokenPath?: string): void {
  if (!enabled || !currentContext) return;
  const ctx = currentContext;
  const record: TraceRecord = {
    ts: Date.now(),
    scope: "render",
    elementId: ctx.elementId,
    screenPath: ctx.screenPath,
    molecule: ctx.molecule,
    steps: [...ctx.steps],
    status: ctx.status,
    error: ctx.error,
  };
  if (prop != null) record.prop = prop;
  if (tokenPath != null) record.tokenPath = tokenPath;
  tracesByElementId.set(ctx.elementId, record);
  currentContext = null;
}

export function getTraceByElementId(id: string): TraceRecord | undefined {
  return tracesByElementId.get(id);
}

export function setComputedForElement(id: string, computed: Record<string, string>): void {
  const t = tracesByElementId.get(id);
  if (t) t.computedStyles = computed;
}

export function clear(): void {
  currentContext = null;
  tracesByElementId.clear();
}

export function recordTrace(event: Partial<TraceRecord> & { elementId: string }): void {
  const existing = tracesByElementId.get(event.elementId);
  const merged: TraceRecord = {
    ts: event.ts ?? Date.now(),
    scope: event.scope ?? "diagnostic",
    elementId: event.elementId,
    screenPath: event.screenPath ?? "",
    molecule: event.molecule ?? "",
    steps: event.steps ?? existing?.steps ?? [],
    status: event.status ?? existing?.status ?? "pass",
    error: event.error ?? existing?.error,
    computedStyles: event.computedStyles ?? existing?.computedStyles,
  };
  if (event.prop != null) merged.prop = event.prop;
  if (event.tokenPath != null) merged.tokenPath = event.tokenPath;
  tracesByElementId.set(event.elementId, merged);
}
