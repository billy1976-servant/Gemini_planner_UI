// src/state/state-store.ts
"use client";
import { deriveState } from "./state-resolver";


/* ======================
 * EVENT LOG
 * ====================== */
type StateEvent = {
  intent: string;
  payload?: any;
};


let log: StateEvent[] = [];
let state = deriveState(log); // ✅ FIX: never start with {}


const listeners = new Set<() => void>();


/* ======================
 * 🔒 DERIVATION GUARD (CRITICAL)
 * ====================== */
let isDeriving = false;


/* ======================
 * PUBLIC API
 * ====================== */
export function getState() {
  return state;
}


export function subscribeState(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}


export function dispatchState(intent: string, payload?: any) {
  // ❌ Never dispatch during derivation
  if (isDeriving) return;


  log.push({ intent, payload });


  isDeriving = true;
  try {
    state = deriveState(log);
  } finally {
    isDeriving = false;
  }

  // Phase B: keep high-frequency candidate typing out of persistence.
  // We still keep it in-memory for reactive rendering.
  if (intent !== "state.update") {
    persist();
  }
  listeners.forEach(l => l());
}


/* ======================
 * EVENT BRIDGE
 * ====================== */
function installStateMutateBridge() {
  if (typeof window === "undefined") return;
  const w = window as any;
  if (w.__STATE_MUTATE_BRIDGE_INSTALLED__) return;
  w.__STATE_MUTATE_BRIDGE_INSTALLED__ = true;


  window.addEventListener("state-mutate", (e: any) => {
    const detail = e?.detail;
    if (!detail?.name) return;
    const { name, ...payload } = detail;
    dispatchState(name, payload);
  });
}
installStateMutateBridge();


/* ======================
 * INITIAL VIEW SEED
 * ====================== */
let initialViewSeeded = false;


export function ensureInitialView(defaultView: string) {
  if (initialViewSeeded) return;
  initialViewSeeded = true;


  // ✅ state is now guaranteed derived
  if (!state?.currentView) {
    dispatchState("state:currentView", { value: defaultView });
  }
}


/* ======================
 * PERSISTENCE
 * ====================== */
const KEY = "__app_state_log__";


function persist() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(log));
  } catch {}
}


function rehydrate() {
  if (typeof window === "undefined") return;


  try {
    const raw = localStorage.getItem(KEY);
    log = raw ? JSON.parse(raw) : [];
  } catch {
    log = [];
  }


  isDeriving = true;
  try {
    state = deriveState(log);
  } finally {
    isDeriving = false;
  }
}


/* ======================
 * BOOTSTRAP
 * ====================== */
if (typeof window !== "undefined") {
  rehydrate();
  ensureInitialView("|home");
  (window as any).TEST_STATE = () =>
    dispatchState("journal.set", { key: "test", value: "hello" });
}


/* ======================
 * OPTIONAL INGESTION API
 * ====================== */
export function recordScan(scan: any) {
  dispatchState("scan.record", scan);
}


export function recordScanBatch(scans: any[]) {
  dispatchState("scan.batch", { scans });
}


