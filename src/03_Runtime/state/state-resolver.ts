// src/state/state-resolver.ts
import type { StateEvent } from "./state";
import { logRuntimeDecision } from "@/engine/devtools/runtime-decision-trace";
import { PipelineDebugStore } from "@/devtools/pipeline-debug-store";


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

  /* ====================================================
     layoutByScreen — layout override target for renderer
     - Written by layout.override; consumed by page → JsonRenderer
     - Do not store layout presets in values
  ==================================================== */
  layoutByScreen?: Record<string, { section: Record<string, string>; card: Record<string, string>; organ: Record<string, string> }>;
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
    layoutByScreen: {},
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
        if (process.env.NODE_ENV !== "production") {
          console.log("[state-resolver] state.update set", key, payload.value);
        }
      }
      continue;
    }

    /* =========================
       LAYOUT OVERRIDE (per-screen section/card/organ)
       - Renderer consumes state.layoutByScreen[screenKey]
       - Do not write layout presets to values
    ========================== */
    if (intent === "layout.override") {
      const { screenKey, type, sectionId, presetId } = payload;
      if (typeof screenKey !== "string" || typeof type !== "string" || typeof sectionId !== "string" || typeof presetId !== "string") continue;
      if (!derived.layoutByScreen![screenKey]) {
        derived.layoutByScreen![screenKey] = { section: {}, card: {}, organ: {} };
      }
      const t = type as "section" | "card" | "organ";
      if (t === "section" || t === "card" || t === "organ") {
        derived.layoutByScreen![screenKey][t][sectionId] = presetId;
      }
      console.log("FLOW 3 — STATE WRITE", {
        screenKey,
        type: t,
        sectionId,
        presetId,
        stateAfter: derived.layoutByScreen?.[screenKey],
      });
      if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
        PipelineDebugStore.mark("state-resolver", "layout.override", {
          screenKey,
          type: t,
          sectionId,
          presetId,
        });
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
    if (intent === "scan.record") {
      derived.scans!.push(payload);
      continue;
    }
    if (intent === "scan.batch") {
      const scans = payload?.scans;
      if (Array.isArray(scans)) derived.scans!.push(...scans);
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
      layoutByScreenKeys: derived.layoutByScreen ? Object.keys(derived.layoutByScreen) : [],
      scansCount: derived.scans?.length ?? 0,
      interactionsCount: derived.interactions?.length ?? 0,
    },
    downstreamEffect: "derived state snapshot",
  });
  return derived;
}


