// src/state/state-store.ts
"use client";
import { deriveState } from "./state-resolver";
import stateDefaults from "@/config/state-defaults.json";
import { trace } from "@/devtools/interaction-tracer.store";
import { PipelineDebugStore } from "@/devtools/pipeline-debug-store";
import { recordStage } from "@/engine/debug/pipelineStageTrace";


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


  const prevState = state;
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
  PipelineDebugStore.setLastStateIntent(intent, getState() ?? {});
  trace({ time: Date.now(), type: "state", label: intent, payload });

  const nextState = state;
  if (process.env.NODE_ENV === "development") {
    if (nextState !== prevState) {
      const key =
        intent === "state.update" && payload && typeof payload.key === "string"
          ? payload.key
          : intent;
      const value = payload?.value;
      const storedValue = key ? nextState?.values?.[key] : undefined;
      const ts = Date.now();
      if (intent === "state.update" && value !== undefined && storedValue !== value) {
        recordStage("state", "fail", { key, expected: value, got: storedValue });
      } else {
        recordStage("state", "pass", { key, value, storedValue, ts });
      }
    } else {
      recordStage("state", "fail", { reason: "No state mutation occurred" });
    }
  }
}


/* ======================
 * EVENT BRIDGE
 * ====================== */
/**
 * Legacy bridge: CustomEvent "state-mutate" → dispatchState(detail.name, payload).
 * External or older consumers can push intents this way. Do not rely for new code;
 * use dispatchState directly or action events. Documented in STATE_INTENTS.md.
 */
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
  ensureInitialView(
    (stateDefaults as { defaultInitialView?: string }).defaultInitialView ?? "|home"
  );
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


