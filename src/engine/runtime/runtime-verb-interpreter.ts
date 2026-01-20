"use client";
/**
 * ======================================================
 * RUNTIME VERB INTERPRETER (LOCKED v1)
 * ======================================================
 *
 * ROLE:
 * - Listens to runtime CustomEvents emitted by molecules
 * - Interprets verbs declared in JSON behavior blocks
 * - Mutates state or triggers navigation ONLY
 *
 * DOES NOT:
 * - Import atoms or molecules
 * - Render UI
 * - Infer defaults
 * - Invent behavior
 *
 * REQUIRED:
 * - state-store (dispatchState)
 * - runtime-navigation (navigate)
 *
 * This is the ONLY execution layer.
 */


/* ======================================================
   IMPORTS
====================================================== */
import { dispatchState } from "@/state/state-store";
import { navigate } from "@/engine/runtime/runtime-navigation";


/* ======================================================
   TYPE GUARDS
====================================================== */
function isObject(x: any): x is Record<string, any> {
  return typeof x === "object" && x !== null;
}


/* ======================================================
   ACTION HANDLER
====================================================== */
function handleAction(detail: any) {
  if (!isObject(detail)) return;


  const params = detail.params;
  if (!isObject(params)) return;


  /**
   * ------------------------------------------------------
   * STATE MUTATION
   * ------------------------------------------------------
   * JSON example:
   * {
   *   "type": "Action",
   *   "params": {
   *     "name": "state:currentView",
   *     "value": "B"
   *   }
   * }
   */
  if (typeof params.name === "string" && params.name.startsWith("state:")) {
    const intent = params.name.replace("state:", "");
    const { value, ...rest } = params;


    dispatchState(intent, {
      value,
      ...rest,
    });


    return;
  }


  /**
   * ------------------------------------------------------
   * ACTION → NAVIGATION (OPTIONAL)
   * ------------------------------------------------------
   */
  if (params.name === "navigate") {
    const to = params.to ?? params.target;
    if (to) navigate(to);
    return;
  }


  /**
   * ------------------------------------------------------
   * UNHANDLED ACTION (SAFE NO-OP)
   * ------------------------------------------------------
   */
  console.warn("[runtime-verb] Unhandled action:", params.name, params);
}


/* ======================================================
   INTERACTION HANDLER (RESERVED)
====================================================== */
function handleInteraction(_detail: any) {
  // Interaction verbs are observational only
  // (analytics, gesture tracking, etc.)
  return;
}


/* ======================================================
   NAVIGATION HANDLER
====================================================== */
function handleNavigation(detail: any) {
  if (!isObject(detail)) return;
  navigate(detail);
}


/* ======================================================
   INSTALL (ONCE)
====================================================== */
let installed = false;


export function installRuntimeVerbInterpreter() {
  if (installed) return;
  if (typeof window === "undefined") return;


  installed = true;


  window.addEventListener("action", (e: any) => {
    handleAction(e.detail);
  });


  window.addEventListener("interaction", (e: any) => {
    handleInteraction(e.detail);
  });


  window.addEventListener("navigate", (e: any) => {
    handleNavigation(e.detail);
  });


  console.info("✅ Runtime Verb Interpreter installed");
}


