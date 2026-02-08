// src/engine/selectors/select-global-scan-time-window.ts


/**
 * GLOBAL SCAN TIME WINDOW SELECTOR
 *
 * PURPOSE:
 * - Bridge derived state → time window reducer
 * - Expose a SIMPLE selector UI can call
 *
 * RULES:
 * - No side effects
 * - No mutation
 * - No timers
 * - No logging
 */


import { reduceScansToTimeWindow } from "./global-scan-time-window-reducer";


export function selectGlobalScanTimeWindow(
  state: any,
  windowMs: number,
  now: number = Date.now()
) {
  return reduceScansToTimeWindow(state?.scans, windowMs, now);
}


