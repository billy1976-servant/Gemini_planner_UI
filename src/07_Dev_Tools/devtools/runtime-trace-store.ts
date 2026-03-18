"use client";
/**
 * Global Runtime Trace Store
 * Lightweight in-memory event buffer for capturing ALL engine decisions.
 * Replaces console spam with structured, filterable trace feed.
 */

export type TraceSystem = "layout" | "state" | "behavior" | "renderer" | "contracts";

export type RuntimeTraceEvent = {
  timestamp: number;
  system: TraceSystem;
  nodeId?: string;
  sectionId?: string;
  action: string;
  input: unknown;
  decision?: unknown;
  override?: string;
  final: unknown;
};

const MAX_EVENTS = 300;
let traceBuffer: RuntimeTraceEvent[] = [];
let listeners = new Set<() => void>();
let persistTraces = false;

function notify() {
  if (process.env.NODE_ENV !== "development") return;
  listeners.forEach((l) => l());
}

/**
 * Push a trace event to the buffer.
 * Maintains rolling buffer of last MAX_EVENTS events.
 */
export function pushTrace(event: Omit<RuntimeTraceEvent, "timestamp">) {
  if (process.env.NODE_ENV !== "development") return;

  const traceEvent: RuntimeTraceEvent = {
    ...event,
    timestamp: Date.now(),
  };

  traceBuffer.push(traceEvent);
  
  // Rolling buffer: keep last MAX_EVENTS
  if (traceBuffer.length > MAX_EVENTS) {
    traceBuffer = traceBuffer.slice(-MAX_EVENTS);
  }

  notify();
}

/**
 * Get all trace events (newest first).
 */
export function getTrace(): RuntimeTraceEvent[] {
  return [...traceBuffer].reverse();
}

/**
 * Get trace events filtered by system.
 */
export function getTraceBySystem(system: TraceSystem): RuntimeTraceEvent[] {
  return traceBuffer.filter((e) => e.system === system).reverse();
}

/**
 * Clear all trace events.
 */
export function clearTrace() {
  if (process.env.NODE_ENV !== "development") return;
  traceBuffer = [];
  notify();
}

/**
 * Subscribe to trace updates.
 */
export function subscribeTrace(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/**
 * Set persistence mode (default: false).
 * When true, traces persist between renders.
 */
export function setPersistTraces(enabled: boolean) {
  persistTraces = enabled;
  if (!enabled) {
    clearTrace();
  }
}

/**
 * Get persistence mode.
 */
export function getPersistTraces(): boolean {
  return persistTraces;
}

// Expose to window for debugging
if (typeof window !== "undefined") {
  (window as any).__RUNTIME_TRACE__ = {
    pushTrace,
    getTrace,
    clearTrace,
    getTraceBySystem,
    setPersistTraces,
    getPersistTraces,
  };
}
