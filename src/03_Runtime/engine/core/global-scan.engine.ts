"use client";
/* ============================================================
   GLOBAL SCAN ENGINE — SINGLE + MULTI SAFE
   ============================================================
   REQUIRED — DO NOT REMOVE THIS FILE OR THESE NOTES.
   PURPOSE:
   - Execute ONE or MANY scan configs
   - Engine is the ONLY place that knows about plurality
   - Scheduler, CLI, and state remain agnostic
   GUARANTEES:
   - Accepts a single config object
   - Accepts an array of config objects
   - Backward compatible with all existing callers
============================================================ */
import { fetchScanSignal } from "@/scans/global-scans/global-scan.sources";
import { dispatchState } from "@/state/state-store";


/* ============================================================
   RESULT CONTRACT (UNCHANGED)
============================================================ */
export type ScanResult = {
  id: string;
  timestamp: number;
  query: string;
  value: number;
};


/* ============================================================
   INTERNAL — run ONE scan
   REQUIRED — DO NOT INLINE OR REMOVE
   This isolates single-scan logic so multi-scan is trivial
============================================================ */
async function runSingleScan(config: any): Promise<ScanResult> {
  if (!config?.source?.query) {
    throw new Error(
      `[global-scan] Invalid scan config — missing source.query`
    );
  }


  const signal = await fetchScanSignal(config.source.query);


  return {
    id: config.id,
    timestamp: signal.timestamp,
    query: signal.query,
    value: signal.value,
  };
}


/* ============================================================
   PUBLIC ENGINE — SINGLE OR MULTI
   REQUIRED — DO NOT CHANGE SIGNATURE
============================================================ */
export async function runGlobalScan(
  config: any
): Promise<ScanResult | ScanResult[]> {
  // 🔒 SINGLE SCAN (legacy + default)
  if (!Array.isArray(config)) {
    return runSingleScan(config);
  }


  // 🔒 MULTI SCAN (new capability)
  const results: ScanResult[] = [];
  for (const cfg of config) {
    const result = await runSingleScan(cfg);
    results.push(result);
  }
  return results;
}


/* ============================================================
   🔧 MANUAL TRIGGER — DEV / PANEL SAFE
   ADDITIVE ONLY — DOES NOT ALTER ENGINE BEHAVIOR
   PURPOSE:
   - Allows ONE click / console call to prove pipeline
   - Emits scan.result into state
   - Zero scheduling
============================================================ */
export async function triggerGlobalScan(config: any) {
  const results = await runGlobalScan(config);


  if (Array.isArray(results)) {
    for (const r of results) {
      dispatchState("scan.result", r);
    }
  } else {
    dispatchState("scan.result", results);
  }


  return results;
}


