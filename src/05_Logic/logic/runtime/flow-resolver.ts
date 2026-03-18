import type { DerivedState } from "@/state/state-resolver";


/**
 * Resolve the next screen to render
 * - Accepts a FLOW ID (string)
 * - Looks up the flow definition
 * - Walks the steps deterministically
 */
import { FLOWS } from "@/logic/flows/flow-definitions";


export function resolveView(
  flowId: string,
  derived: DerivedState
): string {
  const flow = FLOWS[flowId];


  if (!flow) {
    throw new Error(`Unknown flow: ${flowId}`);
  }


  // If no interactions yet, show start screen
  if (!derived.interactions || derived.interactions.length === 0) {
    return flow.start;
  }


  // Track completed calculator steps
  const completed = new Set(
    derived.interactions
      .filter(i => i.type === "calculator.completed")
      .map(i => i.key)
  );


  // Find first unmet step
  for (const step of flow.steps) {
    if (!completed.has(step.requires)) {
      return step.view;
    }
  }


  // Flow finished
  return flow.complete;
}


