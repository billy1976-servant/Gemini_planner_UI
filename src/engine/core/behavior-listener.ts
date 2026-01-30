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
import { dispatchState, getState } from "@/state/state-store"; // ADD
import {
  normalizeBehaviorPayload,
  normalizeNavigateDetail,
} from "@/contracts/behavior-normalize";
import runBehavior from "@/behavior/behavior-runner";


let installed = false;


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


    if (typeof fieldKey === "string" && fieldKey) {
      inputByFieldKey[fieldKey] = value;
      lastFieldKey = fieldKey;
      console.log("[input-change] captured:", { value, fieldKey });

      // Phase B: reconnect Field typing → state-store (candidate surface)
      // Writes into DerivedState.values via intent === "state.update".
      // This enables other components to read live input without waiting for a click action.
      if (value !== undefined) {
        dispatchState("state.update", { key: fieldKey, value });
      }
      return;
    }


    console.warn("[input-change] missing fieldKey — falling back", {
      value,
      fieldKey,
    });
  });
}


export function installBehaviorListener(navigate: (to: string) => void) {
  if (installed) return;
  installed = true;
  if (typeof window === "undefined") return;


  /* =========================
     NAVIGATION
  ========================= */
  window.addEventListener("navigate", (e: any) => {
    const { intent, warnings } = normalizeNavigateDetail(e?.detail);
    warnings.forEach((w) => console.warn("[navigate][normalize]", w, e?.detail));

    if (intent.kind === "navigation") {
      const args = intent.args ?? {};
      const destination =
        (args.to as string | undefined) ??
        (args.screenId as string | undefined) ??
        (args.target as string | undefined);

      if (!destination) {
        console.warn("[navigate] Missing destination after normalization", {
          detail: e?.detail,
          intent,
        });
        return;
      }
      navigate(destination);
      return;
    }

    console.warn("[navigate] Unhandled navigation payload", {
      detail: e?.detail,
      intent,
    });
  });


  /* =========================
     ACTION → STATE / NAV
  ========================= */
  window.addEventListener("action", (e: any) => {
    const behavior = e.detail || {};
    const params = behavior.params || {};
    const actionName = params.name;
    const target = params.target;


    console.log("[action]", actionName, params);


    if (!actionName) {
      console.warn("[action] Missing action name");
      return;
    }

    // Phase 2: normalize legacy behavior into contract-shaped intent (warn-only)
    // Phase 5: keep the normalized intent available for the eventual simplified runtime surface.
    const normalized = normalizeBehaviorPayload(behavior, { allowLegacy: true });
    normalized.warnings.forEach((w) =>
      console.warn("[action][normalize]", w, { actionName, params, intent: normalized.intent })
    );


    /* =========================
       STATE MUTATION BRIDGE
    ========================= */
    if (actionName.startsWith("state:")) {
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
          // Legacy fallback for other state:* mutations that still reference input buffers.
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

      // Phase 2: map legacy state:* action names onto the state-store's real intents
      import("@/state/state-store").then(({ dispatchState }) => {
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

        // Fallback (legacy): keep emitting state-mutate so older consumers can observe it.
        window.dispatchEvent(
          new CustomEvent("state-mutate", {
            detail: {
              name: mutation,
              value: resolvedValue,
              ...rest,
            },
          })
        );
      });

      return;
    }


    /* =========================
       ACTION → NAVIGATE
    ========================= */
    if (actionName === "navigate") {
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
       - Otherwise fall through to the existing runtime verb interpreter
    ========================= */
    if (
      actionName === "tap" ||
      actionName === "double" ||
      actionName === "long" ||
      actionName === "drag" ||
      actionName === "scroll" ||
      actionName === "swipe" ||
      actionName === "go" ||
      actionName === "back" ||
      actionName === "open" ||
      actionName === "close" ||
      actionName === "route" ||
      actionName === "crop" ||
      actionName === "filter" ||
      actionName === "frame" ||
      actionName === "layout" ||
      actionName === "motion" ||
      actionName === "overlay"
    ) {
      // Best-effort domain inference for Action verbs (contract says infer from content type).
      const domain =
        actionName === "crop" ||
        actionName === "filter" ||
        actionName === "frame" ||
        actionName === "layout" ||
        actionName === "motion" ||
        actionName === "overlay"
          ? (params.domain ?? "image")
          : actionName === "tap" ||
            actionName === "double" ||
            actionName === "long" ||
            actionName === "drag" ||
            actionName === "scroll" ||
            actionName === "swipe"
          ? "interaction"
          : "navigation";

      try {
        runBehavior(domain, actionName, { navigate }, params);
      } catch (err) {
        console.warn("[behavior-runner] failed", { domain, actionName, err });
      }

      return;
    }


    /* =========================
       DEV VISUAL PROOF
    ========================= */
    if (actionName === "visual-proof") {
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
        const { interpretRuntimeVerb } = require("../../logic/runtime/runtime-verb-interpreter");

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
  });


  /* =========================
     INTERACTION (RESERVED)
  ========================= */
  window.addEventListener("interaction", () => {});
}


