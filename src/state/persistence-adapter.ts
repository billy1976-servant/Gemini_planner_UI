const KEY = "__app_state_log__";


/**
 * ============================================================
 * 🔒 PERSISTENCE ADAPTER — CANONICAL (EVENT-LOG BASED)
 * ============================================================
 *
 * ⚠️ DO NOT REMOVE OR INLINE ANY LOGIC IN THIS FILE
 *
 * PURPOSE:
 * - Persist the FULL append-only state event log
 * - Enable deterministic replay via state-resolver
 * - Support timeline scrubbing and reconstruction
 *
 * IMPORTANT:
 * - This file is intentionally GENERIC
 * - It does NOT know about scans, journals, or UI
 * - It persists EVENTS, not derived state
 *
 * ✅ SCANS WORK HERE AUTOMATICALLY
 * Because scan results are dispatched as state events,
 * they are already included in this log with ZERO changes.
 *
 * 🚫 DO NOT:
 * - Add interpretation logic
 * - Add reducers
 * - Add async behavior
 * - Add scan-specific code
 *
 * This adapter is intentionally boring.
 * That is what makes it powerful.
 */


/**
 * Save the full state event log
 * 🔒 REQUIRED — must never throw
 */
export function saveLog(log: any[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(log));
  } catch {
    // fail silently — persistence must never crash the app
  }
}


/**
 * Load the full state event log
 * 🔒 REQUIRED — replay-safe
 */
export function loadLog(): any[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}


/**
 * ============================================================
 * 🔑 CANONICAL BOOTSTRAP API
 * ============================================================
 *
 * This is what layout.tsx MUST call.
 *
 * NOTE:
 * - This returns RAW EVENTS, not derived state
 * - state-resolver is responsible for rebuilding meaning
 *
 * SCANS:
 * - scan.interpreted events are restored here automatically
 * - analyzer history can later rehydrate from these events
 */
export function loadState(): any[] {
  return loadLog();
}


