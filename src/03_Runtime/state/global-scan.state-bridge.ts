"use client";
/* ============================================================
   GLOBAL SCAN STATE BRIDGE — INTERPRETED OUTPUT
   ============================================================
   REQUIRED — DO NOT REMOVE OR INLINE.
   PURPOSE:
   - Bridge scan execution → state system
   - Convert RAW scan results into INTERPRETED scans
   - Dispatch expanded, useful data into state
   THIS IS THE MISSING LINK.
============================================================ */
import { runGlobalScan } from "@/engine/core/global-scan.engine";
import { analyzeScan } from "@/scans/global-scans/global-scan.analyzer";
import { dispatchState } from "./state-store";


/* ============================================================
   EXECUTION GUARD (CRITICAL)
   Ensures raw scan runs ONCE per process
============================================================ */
let rawScanHasRun = false;


/**
 * Execute one or many scans and emit interpreted results
 */
export async function executeGlobalScan(config: any) {
  // 🔒 RAW SCAN — RUN ONCE ONLY
  if (!rawScanHasRun) {
    rawScanHasRun = true;
    await runGlobalScan(config);
  }


  const scanConfigs = Array.isArray(config) ? config : [config];


  // 🔒 Interpret + dispatch (SINGLE canonical path)
  for (const cfg of scanConfigs) {
    const interpreted = await analyzeScan(cfg);


    const payload = {
      id: interpreted.id,
      keyword: interpreted.keyword,
      region: interpreted.region,
      timestamp: interpreted.timestamp,


      // Raw
      rawValue: interpreted.rawValue,


      // Interpreted metrics
      score: interpreted.score,
      momentum: interpreted.momentum,
      trend: interpreted.trend,


      // Metadata
      tags: interpreted.tags,
      source: interpreted.source,
    };


    // ✅ SINGLE DISPATCH (CANONICAL)
    dispatchState("scan.interpreted", payload);
  }
}


