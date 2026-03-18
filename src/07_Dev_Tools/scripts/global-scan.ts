"use client";
/* ============================================================
   GLOBAL SCAN SCRIPT — ENTRYPOINT
   ============================================================
   PURPOSE:
   - Single execution entrypoint
   - Runs scan ONCE
   - Uses state bridge for interpreted results
   - Prints final derived state
   ============================================================ */
import scanConfig from "../scans/global-scans/global-scan.config.json";
import { executeGlobalScan } from "@/state/global-scan.state-bridge";
import { getState } from "@/state/state-store";
/* ============================================================
   MAIN
============================================================ */
async function main() {
  console.log("[GLOBAL SCAN] starting");


  // ✅ SINGLE SOURCE OF TRUTH
  // Raw scan + interpretation happen INSIDE the state bridge
  await executeGlobalScan(scanConfig);


  // ✅ FINAL STATE SNAPSHOT
  const finalState = getState();
  console.log(
    "[GLOBAL SCAN] FINAL DERIVED STATE",
    JSON.stringify(finalState, null, 2)
  );


  console.log("[GLOBAL SCAN] complete");
}


main().catch(err => {
  console.error("[GLOBAL SCAN] failed", err);
  process.exit(1);
});


