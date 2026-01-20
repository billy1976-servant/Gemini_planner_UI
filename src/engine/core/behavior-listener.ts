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
import { interpretRuntimeVerb } from "@/logic/runtime/runtime-verb-interpreter"; // ADD
import { getState } from "@/state/state-store"; // ADD


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
    const to = e.detail?.to;
    if (!to) {
      console.warn("[navigate] Missing destination");
      return;
    }
    navigate(to);
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


      if (valueFrom === "input" && resolvedValue === undefined) {
        console.error("🚨 INPUT PIPELINE BROKEN", {
          mutation,
          params,
          lastInputValue,
          lastFieldKey,
        });
      }


      window.dispatchEvent(
        new CustomEvent("state-mutate", {
          detail: {
            name: mutation,
            value: resolvedValue,
            ...rest,
          },
        })
      );

      // ✅ Also update state store for currentView (ensures re-render)
      // Use the correct intent format that state-resolver expects
      if (mutation === "currentView" && resolvedValue) {
        console.log("[behavior-listener] Dispatching state:currentView", { value: resolvedValue });
        import("@/state/state-store").then(({ dispatchState, getState }) => {
          dispatchState("state:currentView", { value: resolvedValue });
          // Check state after a brief delay to see if it updated
          setTimeout(() => {
            const currentState = getState();
            console.log("[behavior-listener] State after dispatch:", { 
              currentView: currentState?.currentView,
              expected: resolvedValue 
            });
          }, 10);
        });
      }

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


