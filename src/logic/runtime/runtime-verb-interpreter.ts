// src/logic/runtime/runtime-verb-interpreter.ts


import { runAction } from "./action-runner";


/**
 * RUNTIME VERB INTERPRETER
 * ------------------------------------------------------------
 * ORDER (LOCKED):
 * JSON → interaction-controller → verb-interpreter → action-runner → handler
 *
 * This file does ONE thing:
 * - Normalize + forward verbs to the action runner
 * - Never decide
 * - Never mutate
 * - Never swallow verbs
 * ------------------------------------------------------------
 */


export function interpretRuntimeVerb(
  verb: any,
  state: Record<string, any>
) {
  if (!verb) return state;


  // Normalize Action-style verbs
  if (verb.type === "Action" && verb.params) {
    return runAction(
      {
        name: verb.params.name,
        ...verb.params,
      },
      state
    );
  }


  // Direct action verb (already normalized)
  if (typeof verb.name === "string") {
    return runAction(verb, state);
  }


  console.warn("[runtime-verb-interpreter] Unrecognized verb:", verb);
  return state;
}


