// src/state/selectors/global-window-time-window-viewer.ts


/**
 * TIME WINDOW SELECTORS — READ ONLY
 *
 * PURPOSE:
 * - Make scan data inspectable
 * - Reduce noise
 * - Allow sanity checks
 *
 * RULES:
 * - NO dispatch
 * - NO mutation
 * - NO logging
 * - NO timers
 * - NO side effects
 */


import type { DerivedState } from "@/state/state-resolver";


/* ======================================================
   TYPES
====================================================== */


export type TimeWindow = {
  from: number; // epoch ms (inclusive)
  to: number;   // epoch ms (inclusive)
};


/* ======================================================
   CORE SELECTORS
====================================================== */


/**
 * Return ALL scans (safe default)
 */
export function selectAllScans(state: DerivedState) {
  return Array.isArray(state.scans) ? state.scans : [];
}


/**
 * Return scans within a time window
 */
export function selectScansInWindow(
  state: DerivedState,
  window: TimeWindow
) {
  const scans = selectAllScans(state);


  return scans.filter(scan => {
    const ts = scan?.timestamp;
    if (typeof ts !== "number") return false;
    return ts >= window.from && ts <= window.to;
  });
}


/**
 * Return scans from the last N minutes
 */
export function selectScansLastMinutes(
  state: DerivedState,
  minutes: number
) {
  const now = Date.now();
  const from = now - minutes * 60 * 1000;


  return selectScansInWindow(state, { from, to: now });
}


/**
 * Return the most recent scan only
 */
export function selectLatestScan(state: DerivedState) {
  const scans = selectAllScans(state);
  if (scans.length === 0) return null;


  return scans.reduce((latest, current) =>
    current.timestamp > latest.timestamp ? current : latest
  );
}


