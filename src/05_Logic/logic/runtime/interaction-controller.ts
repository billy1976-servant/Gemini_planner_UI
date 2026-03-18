// src/runtime/interaction-controller.ts
import { dispatchState } from "@/state/state-store";
import { interpretRuntimeVerb } from "@/logic/runtime/runtime-verb-interpreter";
import { readEngineState } from "@/logic/runtime/engine-bridge";


/**
 * ============================================================
 * INTERACTION CONTROLLER (LOCKED)
 * ============================================================
 *
 * Responsibilities:
 * - Accept raw interaction payloads from JSON-rendered UI
 * - Record interactions for persistence / analytics
 * - Route declared verbs through the runtime interpreter
 * - Allow engines to mutate state
 *
 * This file is the ONLY bridge between:
 * JSON UI → Runtime → Engines → State
 *
 * JSON NEVER executes logic.
 * JSON ONLY declares intent.
 * ============================================================
 */


/**
 * Primary entry point used by JSON-rendered components
 */
export function recordInteraction(payload: any) {
  // 1. Always record interaction (append-only, persistent)
  dispatchState("interaction.record", payload);


  // 2. If no verb declared, we stop here (pure UI interaction)
  const verb = payload?.verb;
  if (!verb || !verb.name) {
    return;
  }


  // 3. Read current derived state
  const state = readEngineState();


  // 4. Route verb through runtime interpreter
  // This is what connects JSON → logic → engines
  interpretRuntimeVerb(verb, state);
}


/**
 * Optional explicit helper for buttons
 * (kept additive — nothing breaks if unused)
 */
export function handleButtonPress(params: {
  verb?: any;
  meta?: any;
}) {
  recordInteraction({
    type: "button.press",
    ...params,
  });
}


/**
 * Optional explicit helper for field updates
 * (kept additive — nothing breaks if unused)
 */
export function handleFieldChange(params: {
  fieldKey: string;
  value: any;
}) {
  recordInteraction({
    type: "field.change",
    ...params,
  });
}


