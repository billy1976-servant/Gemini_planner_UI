// src/state/state-resolver.ts
import type { StateEvent } from "./state";
import { logRuntimeDecision } from "@/engine/devtools/runtime-decision-trace";


/* ======================================================
   DERIVED STATE SHAPE (EXTEND-ONLY)
====================================================== */
export type DerivedState = {
  journal: Record<string, Record<string, string>>;
  rawCount: number;
  currentView?: string;
  scans?: any[];
  interactions?: any[]; // 🔧 ADD (append-only)


  /* ====================================================
     🔧 ADD: GENERIC KEY/VALUE STATE SURFACE
     - REQUIRED for JSON + TSX parity
     - Used by UserInputViewer, calculators, engines
     - Extend-only, no breaking changes
  ==================================================== */
  values?: Record<string, any>;
};


/* ======================================================
   STATE REPLAY ENGINE (PURE)
====================================================== */
export function deriveState(log: StateEvent[]): DerivedState {
  const derived: DerivedState = {
    journal: {},
    rawCount: log.length,
    scans: [],
    interactions: [],
    values: {}, // 🔧 ADD
  };


  for (const evt of log) {
    const intent = evt.intent;
    const payload = evt.payload || {};


    /* =========================
       VIEW STATE
    ========================== */
    if (intent === "state:currentView") {
      if (typeof payload.value === "string") {
        derived.currentView = payload.value;
      }
      continue;
    }


    /* =========================
       JOURNAL STATE
    ========================== */
    if (intent === "journal.set" || intent === "journal.add") {
      const track =
        typeof payload.track === "string" && payload.track.length > 0
          ? payload.track
          : "default";
      const key = payload.key;
      if (typeof key !== "string") continue;
      const value = payload.value ?? payload.text ?? "";
      if (!derived.journal[track]) derived.journal[track] = {};
      derived.journal[track][key] = value;
      continue;
    }


    /* =========================
       🔧 ADD: GENERIC STATE UPDATE
       THIS IS THE MISSING LINK
       - Used by runCalculator()
       - Used by JSON buttons
       - Used by TSX engines
    ========================== */
    if (intent === "state.update") {
      const key = payload.key;
      if (typeof key === "string") {
        derived.values![key] = payload.value;
      }
      continue;
    }


    /* =========================
       SCANS
    ========================== */
    if (intent === "scan.result" || intent === "scan.interpreted") {
      derived.scans!.push(payload);
      continue;
    }


    /* =========================
       INTERACTIONS (APPEND-ONLY)
    ========================== */
    if (intent === "interaction.record") {
      derived.interactions!.push(payload);
      continue;
    }
  }


  const intents = log.map((e) => e.intent);
  logRuntimeDecision({
    timestamp: Date.now(),
    engineId: "state-deriver",
    decisionType: "state-derivation",
    inputsSeen: { logLength: log.length, intents: intents.slice(-50) },
    ruleApplied: "deriveState branch per intent (state:currentView | journal.* | state.update | scan.* | interaction.record)",
    decisionMade: {
      hasCurrentView: derived.currentView !== undefined,
      journalTracks: Object.keys(derived.journal),
      valuesKeys: derived.values ? Object.keys(derived.values) : [],
      scansCount: derived.scans?.length ?? 0,
      interactionsCount: derived.interactions?.length ?? 0,
    },
    downstreamEffect: "derived state snapshot",
  });
  return derived;
}


