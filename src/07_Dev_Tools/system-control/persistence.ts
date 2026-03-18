/**
 * Persistence layer: save/load last scan timestamp, plan selection, health score.
 * localStorage only; no server. Enables tracking system improving over time.
 */

import type { PersistedControlState, StabilityScores } from "./types";

const STORAGE_KEY = "system-control-state";

export function loadControlState(): PersistedControlState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as PersistedControlState;
    if (typeof data.lastScanTimestamp !== "number" || !Array.isArray(data.lastPlanSelection)) {
      return null;
    }
    return {
      lastScanTimestamp: data.lastScanTimestamp,
      lastPlanSelection: data.lastPlanSelection,
      previousHealthScore: typeof data.previousHealthScore === "number" ? data.previousHealthScore : 0,
      previousStabilityScores: data.previousStabilityScores ?? undefined,
    };
  } catch {
    return null;
  }
}

export function saveControlState(state: Partial<PersistedControlState>): void {
  if (typeof window === "undefined") return;
  try {
    const existing = loadControlState();
    const merged: PersistedControlState = {
      lastScanTimestamp: state.lastScanTimestamp ?? existing?.lastScanTimestamp ?? 0,
      lastPlanSelection: state.lastPlanSelection ?? existing?.lastPlanSelection ?? [],
      previousHealthScore: state.previousHealthScore ?? existing?.previousHealthScore ?? 0,
      previousStabilityScores: state.previousStabilityScores ?? existing?.previousStabilityScores,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // ignore
  }
}

export function saveAfterScan(healthScore: number, stabilityScores?: StabilityScores): void {
  saveControlState({
    lastScanTimestamp: Date.now(),
    previousHealthScore: healthScore,
    previousStabilityScores: stabilityScores,
  });
}

export function savePlanSelection(planIds: string[]): void {
  saveControlState({ lastPlanSelection: planIds });
}
