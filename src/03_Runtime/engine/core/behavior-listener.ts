"use client";
/**
 * GLOBAL BEHAVIOR LISTENER — v1.2 (INPUT-AWARE, CORE-SAFE)
 * Single execution bridge between JSON intent and runtime behavior.
 *
 * ✔ NO domain logic
 * ✔ NO journal knowledge
 * ✔ PURE event routing
 * ✔ HARD DIAGNOSTICS for valueFrom:"input"
 */
import { dispatchState, getState } from "@/state/state-store";
import { setPalette } from "@/engine/core/palette-store";
import runBehavior from "@/behavior/behavior-runner";
import { CONTRACT_VERBS, inferContractVerbDomain } from "@/contracts/contract-verbs";
import { trace } from "@/devtools/interaction-tracer.store";
import { PipelineDebugStore } from "@/devtools/pipeline-debug-store";
import { recordStage, resetPipelineTrace } from "@/engine/debug/pipelineStageTrace";


let installed = false;
let installCount = 0;


/** 🔑 Global ephemeral input buffer (NOT state) */
let lastInputValue: string | undefined;


/** ✅ Per-field ephemeral buffer (prevents multi-input collisions) */
const inputByFieldKey: Record<string, string> = {};
let lastFieldKey: string | undefined;


/** 🔹 ADD — Runtime re-entrancy guard (ephemeral, non-state) */
let runtimeInFlight = false;


/**
 * Capture user typing from FieldAtom
 * This is NOT business logic — it is event wiring ONLY
 */
if (typeof window !== "undefined") {
  window.addEventListener("input-change", (e: any) => {
    const value = e?.detail?.value;
    const fieldKey = e?.detail?.fieldKey;
    lastInputValue = value;

    // No invented fallback: when fieldKey is missing we do not dispatch (explicit no-op).
    if (typeof fieldKey !== "string" || !fieldKey) {
      console.warn("[input-change] missing fieldKey — skipping dispatch (no fallback)", {
        value,
        fieldKey,
      });
      return;
    }

    inputByFieldKey[fieldKey] = value;
    lastFieldKey = fieldKey;
    console.log("[input-change] captured:", { value, fieldKey });

    // Phase B: reconnect Field typing → state-store (candidate surface)
    // Writes into DerivedState.values via intent === "state.update".
    if (value !== undefined) {
      dispatchState("state.update", { key: fieldKey, value });
    }
  });
}


export function installBehaviorListener(navigate: (to: string) => void) {
  if (typeof window === "undefined") return;
  installCount += 1;
  if (installed) {
    if (process.env.NODE_ENV === "development") {
      recordStage("listener", "warn", { installedTwice: true, count: installCount });
    }
    return;
  }
  installed = true;
  if (process.env.NODE_ENV === "development") {
    recordStage("listener", "pass", { installed: true, ts: Date.now() });
  }


  /* =========================
     NAVIGATION
  ========================= */
  window.addEventListener("navigate", (e: any) => {
    const detail = e?.detail ?? {};
    const args = typeof detail === "object" && detail !== null ? detail : {};
    const destination =
      (args.to as string | undefined) ??
      (args.screenId as string | undefined) ??
      (args.target as string | undefined);

    if (destination) {
      navigate(destination);
      return;
    }

    console.warn("[navigate] Missing destination", { detail: e?.detail });
  });


  /* =========================
     ACTION → STATE / NAV
  ========================= */
  window.addEventListener("action", (e: any) => {
    resetPipelineTrace();
    const behavior = e.detail || {};
    const params = behavior?.params ?? {};
    console.log("FLOW 2 — ACTION RECEIVED", params);
    const actionName = params.name;
    const target = params.target;
    if (process.env.NODE_ENV === "development") {
      const state = getState();
      const snap = PipelineDebugStore.getSnapshot();
      PipelineDebugStore.setBeforeSnapshot({
        stateValues: state?.values,
        layoutMap: { ...(snap.layoutMap ?? {}) },
      });
      PipelineDebugStore.mark("behavior-listener", "action.receive", {
        actionName,
        target: target ?? null,
      });
    }
    const ts = Date.now();

    if (process.env.NODE_ENV === "development") {
      if (!behavior || typeof params !== "object") {
        recordStage("action", "fail", { reason: "Missing params" });
      } else if (!actionName) {
        recordStage("action", "fail", { reason: "No action name provided on action event" });
      } else {
        recordStage("action", "pass", { name: params.name, key: params.key, value: params.value, ts });
      }
    }

    PipelineDebugStore.setLastBehavior(behavior);
    PipelineDebugStore.setLastAction(actionName ?? null);
    trace({ time: ts, type: "event", label: actionName, payload: params });
    if (process.env.NODE_ENV === "development") {
      console.log("[action]", actionName, params);
    }

    if (!actionName) {
      console.warn("[action] Missing action name");
      return;
    }

    /* =========================
       STATE MUTATION BRIDGE
    ========================= */
    if (actionName.startsWith("state:")) {
      if (process.env.NODE_ENV === "development") {
        recordStage("behavior", "pass", { matched: false, bypass: "state:update is direct state op", matchedBehavior: actionName });
      }
      const mutation = actionName.replace("state:", "");
      const {
        name: _drop,
        valueFrom,
        value,
        fieldKey: fkParam,
        ...rest
      } = params;


      let resolvedValue = value;


      if (valueFrom === "input") {
        // Phase B (final): journal.add must read from state.values, not legacy input buffers.
        if (mutation === "journal.add") {
          const fk = typeof fkParam === "string" && fkParam ? fkParam : undefined;
          const inputValue = fk ? getState()?.values?.[fk] : undefined;
          resolvedValue = inputValue;

          // Debug (logging only): confirm journal.add input resolution source
          console.log("[journal.add][resolve]", {
            track: rest.track,
            fieldKey: fk,
            value: inputValue,
          });
        } else {
          // Legacy fallback (documented): for state:* other than journal.add, valueFrom "input"
          // may resolve from ephemeral buffers (lastFieldKey, inputByFieldKey, lastInputValue)
          // when fieldKey is omitted. Prefer explicit fieldKey + state.values for new flows.
          const fk =
            typeof fkParam === "string" && fkParam
              ? fkParam
              : typeof lastFieldKey === "string"
              ? lastFieldKey
              : undefined;

          resolvedValue =
            fk && Object.prototype.hasOwnProperty.call(inputByFieldKey, fk)
              ? inputByFieldKey[fk]
              : lastInputValue;
        }
      }


      if (valueFrom === "input" && resolvedValue === undefined) {
        console.error("🚨 INPUT PIPELINE BROKEN", {
          mutation,
          params,
          lastInputValue,
          lastFieldKey,
        });
      }

      // Phase 2: map legacy state:* action names onto the state-store's real intents (sync so layout dropdown → state is visible on next render)
      // View selection
      if (mutation === "currentView" && resolvedValue !== undefined) {
        dispatchState("state:currentView", { value: resolvedValue });
        return;
      }

      // Generic key/value update (matches state-resolver intent === "state.update")
      if (mutation === "update") {
        const key = rest.key ?? rest.target;
        if (typeof key === "string" && key.length > 0) {
          dispatchState("state.update", { key, value: resolvedValue });
          // Palette = visual only; sync to palette-store so renderer/CSS see it. Never write palette to layout.
          if (key === "paletteName" && resolvedValue != null) {
            setPalette(String(resolvedValue));
          }
          if (process.env.NODE_ENV === "development") {
            PipelineDebugStore.mark("behavior-listener", "action.dispatchState", {
              intent: "state.update",
              key,
            });
          }
          console.log("STATE WRITE", key, getState()?.values?.[key]);
          return;
        }
      }

      // Journal add (matches state-resolver intent === "journal.add")
      if (mutation === "journal.add") {
        const track = rest.track;
        const key = rest.key;
        if (typeof key === "string") {
          dispatchState("journal.add", {
            track,
            key,
            value: resolvedValue,
          });
          return;
        }
      }

      // Legacy: emit state-mutate so older consumers can observe; do not rely for new code.
      window.dispatchEvent(
        new CustomEvent("state-mutate", {
          detail: {
            name: mutation,
            value: resolvedValue,
            ...rest,
          },
        })
      );

      return;
    }


    /* =========================
       ACTION → NAVIGATE
    ========================= */
    if (actionName === "navigate") {
      recordStage("behavior", "pass", { matchedBehavior: actionName });
      const to = params.to;
      if (!to) {
        console.warn("[action:navigate] Missing 'to'");
        return;
      }
      navigate(to);
      return;
    }

    /* =========================
       CONTRACT VERB PATH (PHASE 3)
       - If actionName is a contract verb token, route it through BehaviorRunner
       - Verb set and domain inference from @/behavior/contract-verbs (single source)
    ========================= */
    if (CONTRACT_VERBS.has(actionName)) {
      const domain = inferContractVerbDomain(actionName, params.domain);
      const ctx = {
        navigate,
        setScreen: (id: string) => navigate("|" + id),
        openModal: (id: string) => navigate("modal:" + id),
        setFlow: (id: string) => navigate("flow:" + id),
        goBack: (n: number | string = 1) =>
          navigate(typeof n === "number" ? "back:" + n : "back:" + n),
        goRoot: () => navigate("root"),
        openPanel: (id: string) => navigate("panel:" + id),
        openSheet: (id: string) => navigate("sheet:" + id),
        closePanel: () => navigate("panel:close"),
        closeSheet: () => navigate("sheet:close"),
      };
      try {
        runBehavior(domain, actionName, ctx, params);
        trace({ time: Date.now(), type: "behavior", label: actionName });
        recordStage("behavior", "pass", { matchedBehavior: actionName });
      } catch (err) {
        console.warn("[behavior-runner] failed", { domain, actionName, err });
        recordStage("behavior", "fail", { matchedBehavior: null });
      }
      return;
    }


    /* =========================
       DEV VISUAL PROOF
    ========================= */
    if (actionName === "visual-proof") {
      recordStage("behavior", "pass", { matchedBehavior: actionName });
      if (!target) return;
      const el = document.querySelector(
        `[data-node-id="${target}"]`
      ) as HTMLElement | null;
      if (!el) return;
      el.textContent = "IT WORKED";
      el.style.background = "green";
      el.style.color = "white";
      return;
    }


    /* =========================
       RUNTIME VERB HANDOFF (ADD ONLY)
    ========================= */


    /** 🔹 ADD — Prevent infinite re-entry */
    if (runtimeInFlight) {
      console.warn("[runtime] Skipping re-entrant action:", actionName);
      return;
    }

    recordStage("behavior", "pass", { matchedBehavior: actionName });
    const currentState = getState?.();
    if (currentState) {
      runtimeInFlight = true;


      /** 🔹 ADD — Diagnostics BEFORE */
      console.groupCollapsed("[runtime] BEFORE", actionName);
      console.log("state:", currentState);
      console.log("params:", params);
      console.groupEnd();


      try {
        // Lazy-load the runtime interpreter to avoid pulling in engine-only action modules
        // for code paths that never use it (keeps the core behavior bridge lightweight).
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { interpretRuntimeVerb } = require("@/logic/runtime/runtime-verb-interpreter");

        interpretRuntimeVerb(
          {
            name: actionName,
            ...params,
          },
          currentState
        );
      } finally {
        /** 🔹 ADD — Diagnostics AFTER */
        const nextState = getState?.();
        console.groupCollapsed("[runtime] AFTER", actionName);
        console.log("state:", nextState);
        console.groupEnd();


        runtimeInFlight = false;
      }


      return;
    }


    console.warn("[action] Unhandled action:", actionName);
    recordStage("behavior", "fail", { matchedBehavior: null, reason: "No behavior matched action" });
  });


  /* =========================
     INTERACTION (RESERVED)
  ========================= */
  window.addEventListener("interaction", () => {});
}


