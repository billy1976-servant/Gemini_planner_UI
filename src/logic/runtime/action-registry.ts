// src/logic/runtime/action-registry.ts


import { runCalculator } from "@/logic/actions/run-calculator.action";
import { run25X } from "@/logic/engines/25x.engine";
import { resolveOnboardingAction } from "@/logic/actions/resolve-onboarding.action";


/**
 * Action handler signature (LOCKED)
 */
type ActionHandler = (action: any, state: Record<string, any>) => any;


/**
 * ============================================================
 * ACTION REGISTRY (EXTEND-ONLY)
 * ============================================================
 *
 * Rules:
 * - Existing actions MUST remain valid
 * - New actions may be added
 * - No renaming
 * - No removal
 * - No logic here — routing only
 * ============================================================
 */
const registry: Record<string, ActionHandler> = {
  // ✅ EXISTING — DO NOT CHANGE
  "logic:runCalculator": runCalculator,


  // ✅ ADDITIVE — 25x engine direct action
  "logic:run25x": run25X,


  // ✅ NEW: Onboarding flow resolver
  "logic:resolveOnboarding": resolveOnboardingAction,
};


/**
 * Lookup helper (LOCKED)
 */
export function getActionHandler(name: string) {
  return registry[name];
}


