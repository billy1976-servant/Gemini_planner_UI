"use client";
import scanConfig from "@/scans/global-scans/global-scan.config.json";
import { executeGlobalScan } from "@/state/global-scan.state-bridge";


type ScanCfg = {
  id: string;
  schedule?: { intervalMinutes?: number; runOnce?: boolean };
  source?: { provider?: string; query?: string; scope?: string };
};


let timers: Record<string, any> = {};


/**
 * START SCHEDULER — STRICT
 * - NO immediate execution
 * - ONLY interval-based execution
 * - ONE timer per scan id
 */
export function startScanScheduler() {
  stopScanScheduler(); // safety reset


  const list: ScanCfg[] = Array.isArray(scanConfig)
    ? (scanConfig as any)
    : [scanConfig as any];


  for (const cfg of list) {
    const minutes = cfg?.schedule?.intervalMinutes;
    if (!minutes) continue;


    const intervalMs = minutes * 60 * 1000;


    console.log("[scan-scheduler] scheduled", {
      scanId: cfg.id,
      intervalMinutes: minutes,
    });


    timers[cfg.id] = setInterval(() => {
      console.log("[scan-scheduler] tick", cfg.id);
      executeGlobalScan([cfg]);
    }, intervalMs);
  }
}


/**
 * STOP SCHEDULER
 */
export function stopScanScheduler() {
  for (const id of Object.keys(timers)) {
    clearInterval(timers[id]);
  }
  timers = {};
  console.log("[scan-scheduler] stopped");
}


/**
 * MANUAL TRIGGER — EXPLICIT ONLY
 * This is the ONLY way to run immediately.
 */
export function runScanNow() {
  console.log("[scan-scheduler] manual run");
  executeGlobalScan(scanConfig as any);
}


