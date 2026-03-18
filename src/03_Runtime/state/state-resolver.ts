// src/state/state-resolver.ts
import type { StateEvent } from "./state";
import { logRuntimeDecision } from "@/engine/devtools/runtime-decision-trace";
import { PipelineDebugStore } from "@/devtools/pipeline-debug-store";

/** Set to true to enable state-resolver and nav merge logging (e.g. window.__DEBUG_STATE_RESOLVER__ = true). */
const DEBUG_STATE_RESOLVER = typeof (globalThis as any).window !== "undefined" && (globalThis as any).window.__DEBUG_STATE_RESOLVER__ === true;


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
     - navTargets: elementId → { toScreenId, toAnchor } for screen-id navigation
  ==================================================== */
  layoutByScreen?: Record<
    string,
    {
      section: Record<string, string>;
      card: Record<string, string>;
      organ: Record<string, string>;
      navTargets?: Record<string, { toScreenId?: string; toAnchor?: string }>;
    }
  >;

  /* ====================================================
     dashboardLayout — widget rects (x,y,w,h) per screen
     - Written by dashboard.layout / dashboard.updateWidget
     - Separate from layoutByScreen (preset IDs)
  ==================================================== */
  dashboardLayout?: Record<string, { widgets: Array<{ id: string; x: number; y: number; w: number; h: number }> }>;
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
    dashboardLayout: {},
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
        if (DEBUG_STATE_RESOLVER && typeof console !== "undefined" && console.log) {
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
        (derived.layoutByScreen![screenKey] as { section: Record<string, string>; card: Record<string, string>; organ: Record<string, string> })[t][sectionId] = presetId;
      }
      if (DEBUG_STATE_RESOLVER && typeof console !== "undefined" && console.log) {
        console.log("FLOW 3 — STATE WRITE", {
          screenKey,
          type: t,
          sectionId,
          presetId,
          stateAfter: derived.layoutByScreen?.[screenKey],
        });
      }
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
       LAYOUT NAV TARGETS (per-screen element → screen id + anchor)
    ========================== */
    if (intent === "layout.setNavTargets") {
      const { screenKey, navTargets: incomingNavTargets } = payload;
      if (typeof screenKey !== "string" || !incomingNavTargets || typeof incomingNavTargets !== "object") continue;
      if (!derived.layoutByScreen![screenKey]) {
        derived.layoutByScreen![screenKey] = { section: {}, card: {}, organ: {} };
      }
      const cast = derived.layoutByScreen![screenKey] as { navTargets?: Record<string, { toScreenId?: string; toAnchor?: string }> };
      const existing = cast.navTargets ?? {};
      const existingKeysBefore = Object.keys(existing);
      cast.navTargets = {
        ...existing,
        ...incomingNavTargets,
      };
      const mergedKeysAfter = Object.keys(cast.navTargets);
      if (typeof (globalThis as any).window !== "undefined") {
        const fn = (globalThis as any).window.__NAV_LOG_STATE_MERGE__;
        if (typeof fn === "function") {
          fn({
            screenKey,
            existingKeysBefore,
            incomingKeys: Object.keys(incomingNavTargets),
            mergedNavTargets: cast.navTargets,
          });
        }
      }
      if (DEBUG_STATE_RESOLVER && typeof console !== "undefined" && console.log) {
        console.log("[NavDebug] resolver layout.setNavTargets", {
          screenKey,
          incomingKeys: Object.keys(incomingNavTargets),
          existingKeysBefore,
          mergedKeysAfter,
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
       DASHBOARD LAYOUT (widget rects per screen)
    ========================== */
    if (intent === "dashboard.layout") {
      const screenKey = typeof payload.screenKey === "string" ? payload.screenKey : "default";
      const widgets = Array.isArray(payload.widgets) ? payload.widgets : [];
      const valid = widgets.filter(
        (w: any) => w && typeof w.id === "string" && typeof w.x === "number" && typeof w.y === "number" && typeof w.w === "number" && typeof w.h === "number"
      );
      derived.dashboardLayout![screenKey] = { widgets: valid };
      continue;
    }
    if (intent === "dashboard.updateWidget") {
      const screenKey = typeof payload.screenKey === "string" ? payload.screenKey : "default";
      const widgetId = payload.widgetId;
      const rect = payload.rect;
      if (typeof widgetId !== "string" || !rect || typeof rect.x !== "number" || typeof rect.y !== "number" || typeof rect.w !== "number" || typeof rect.h !== "number") continue;
      if (!derived.dashboardLayout![screenKey]) derived.dashboardLayout![screenKey] = { widgets: [] };
      const list = derived.dashboardLayout![screenKey].widgets;
      const idx = list.findIndex((w) => w.id === widgetId);
      const entry = { id: widgetId, x: rect.x, y: rect.y, w: rect.w, h: rect.h };
      if (idx >= 0) list[idx] = entry;
      else list.push(entry);
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
  if (DEBUG_STATE_RESOLVER) {
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
  }
  return derived;
}


