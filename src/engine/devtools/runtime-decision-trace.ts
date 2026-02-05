/**
 * Runtime Decision Trace — lightweight logger for engine-level decisions.
 * Non-intrusive: does not modify engine logic. Safe when devtools disabled or in SSR.
 * Schema: src/docs/ARCHITECTURE_AUTOGEN/SYSTEM_INTELLIGENCE/RUNTIME_DECISION_TRACE_SCHEMA.md
 */

export type RuntimeDecisionTrace = {
  timestamp: string | number;
  engineId: string;
  decisionType: string;
  inputsSeen: Record<string, unknown>;
  ruleApplied: string | Record<string, unknown>;
  decisionMade: unknown;
  downstreamEffect?: string | Record<string, unknown>;
};

declare global {
  interface Window {
    __RUNTIME_DECISION_LOG__?: RuntimeDecisionTrace[];
  }
}

const LOG_KEY = "__RUNTIME_DECISION_LOG__";

/**
 * Append a trace entry to the global log. Safe in SSR (no-op when window is undefined).
 * Does not throw if the log was removed or disabled.
 */
export function logRuntimeDecision(trace: RuntimeDecisionTrace): void {
  if (typeof window === "undefined") return;
  try {
    let log = (window as unknown as Record<string, unknown>)[LOG_KEY];
    if (!Array.isArray(log)) {
      (window as unknown as Record<string, unknown>)[LOG_KEY] = [];
      log = (window as unknown as Record<string, unknown>)[LOG_KEY];
    }
    (log as RuntimeDecisionTrace[]).push(trace);
  } catch {
    // Devtools disabled or log removed — no-op
  }
}

/**
 * Return current log snapshot (for viewer). Empty array if not present or not in browser.
 */
export function getRuntimeDecisionLog(): RuntimeDecisionTrace[] {
  if (typeof window === "undefined") return [];
  const log = (window as unknown as Record<string, unknown>)[LOG_KEY];
  return Array.isArray(log) ? [...(log as RuntimeDecisionTrace[])] : [];
}

/**
 * Clear the log (dev only, e.g. viewer "Clear" button).
 */
export function clearRuntimeDecisionLog(): void {
  if (typeof window === "undefined") return;
  try {
    (window as unknown as Record<string, unknown>)[LOG_KEY] = [];
  } catch {
    // no-op
  }
}
