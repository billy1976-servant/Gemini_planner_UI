// src/logic/runtime/action-runner.ts


import { getActionHandler } from "@/logic/engine-system/engine-contract";


/**
 * ACTION RUNNER
 * ------------------------------------------------------------
 * - Single responsibility: route an action to its handler
 * - NO logic
 * - NO engine knowledge
 * - NO side effects beyond invoking handler
 * - REQUIRED return for pipeline continuity
 * ------------------------------------------------------------
 */


export function runAction(action: any, state: Record<string, any>) {
  if (!action || typeof action.name !== "string") {
    console.error("[action-runner] Invalid action:", action);
    return state;
  }


  const handler = getActionHandler(action.name);


  if (!handler) {
    console.error("[action-runner] No handler for action:", action.name);
    return state;
  }


  try {
    handler(action, state);
  } catch (err) {
    console.error(
      "[action-runner] Handler threw for action:",
      action.name,
      err
    );
  }


  // 🔑 CRITICAL:
  // Always return state so the verb pipeline never breaks
  return state;
}


