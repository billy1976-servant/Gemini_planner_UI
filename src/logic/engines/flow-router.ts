// src/logic/engines/flow-router.ts
// Content-only routing layer - engine decides next step based on signals

import type { EducationFlow } from "../content/flow-loader";
import type { EngineState } from "../runtime/engine-state";
import { deriveEngineState } from "../runtime/engine-state";
import type { PresentationModel } from "./presentation-types";

export type RoutingRule = {
  when: {
    signals?: string[];
    blockers?: string[];
    opportunities?: string[];
  };
  then: "skip" | "goto" | "repeat";
  skipTo?: string;
  gotoStep?: string;
  repeatStep?: string;
};

export type FlowRouting = {
  defaultNext: "linear" | "signal-based";
  rules?: RoutingRule[];
};

/**
 * Determine next step based on current signals and routing rules
 * Also computes and returns updated EngineState
 * Returns { nextStepIndex, engineState } or null if flow is complete
 */
export function resolveNextStep(
  flow: EducationFlow,
  currentStepIndex: number,
  accumulatedSignals: string[],
  accumulatedBlockers: string[],
  accumulatedOpportunities: string[],
  outcomes: Array<{
    stepId: string;
    choiceId: string;
    outcome: {
      signals?: string[];
      blockers?: string[];
      opportunities?: string[];
      severity?: "low" | "medium" | "high";
    };
  }>,
  presentation: PresentationModel | null,
  calcOutputs: Record<string, any> = {},
  engineId: string = "learning"
): { nextStepIndex: number | null; engineState: EngineState } {
  const routing = (flow as any).routing as FlowRouting | undefined;
  const orderedStepIds = presentation?.stepOrder ?? flow.steps.map((s) => s.id);
  
  let nextStepIndex: number | null = null;
  
  // If no routing config, use linear progression
  if (!routing || routing.defaultNext === "linear") {
    const nextIndex = currentStepIndex + 1;
    nextStepIndex = nextIndex < orderedStepIds.length ? nextIndex : null;
  } else {
    // Signal-based routing
    if (routing.rules && routing.rules.length > 0) {
      for (const rule of routing.rules) {
        const matches = evaluateRoutingRule(rule, {
          signals: accumulatedSignals,
          blockers: accumulatedBlockers,
          opportunities: accumulatedOpportunities,
        });

        if (matches) {
          const actionResult = applyRoutingAction(rule, flow, currentStepIndex, orderedStepIds);
          nextStepIndex = actionResult;
          break;
        }
      }
    }
    
    // Default: linear progression if no rule matched
    if (nextStepIndex === null) {
      const nextIndex = currentStepIndex + 1;
      nextStepIndex = nextIndex < orderedStepIds.length ? nextIndex : null;
    }
  }
  
  // Derive EngineState once per choice
  const engineState = deriveEngineState(
    flow,
    presentation,
    nextStepIndex !== null ? nextStepIndex : currentStepIndex,
    outcomes,
    calcOutputs,
    engineId
  );
  
  return { nextStepIndex, engineState };
}

/**
 * Evaluate if a routing rule matches current state
 */
function evaluateRoutingRule(
  rule: RoutingRule,
  state: {
    signals: string[];
    blockers: string[];
    opportunities: string[];
  }
): boolean {
  const { when } = rule;

  // Check signals
  if (when.signals && when.signals.length > 0) {
    const hasAllSignals = when.signals.every((s) => state.signals.includes(s));
    if (!hasAllSignals) return false;
  }

  // Check blockers
  if (when.blockers && when.blockers.length > 0) {
    const hasAnyBlocker = when.blockers.some((b) => state.blockers.includes(b));
    if (!hasAnyBlocker) return false;
  }

  // Check opportunities
  if (when.opportunities && when.opportunities.length > 0) {
    const hasAnyOpp = when.opportunities.some((o) => state.opportunities.includes(o));
    if (!hasAnyOpp) return false;
  }

  return true;
}

/**
 * Apply routing action (skip, goto, repeat)
 * Returns index in orderedStepIds (presentation order)
 */
function applyRoutingAction(
  rule: RoutingRule,
  flow: EducationFlow,
  currentStepIndex: number,
  orderedStepIds: string[]
): number | null {
  if (rule.then === "skip" && rule.skipTo) {
    const targetIndex = orderedStepIds.indexOf(rule.skipTo);
    return targetIndex >= 0 ? targetIndex : currentStepIndex + 1;
  }

  if (rule.then === "goto" && rule.gotoStep) {
    const targetIndex = orderedStepIds.indexOf(rule.gotoStep);
    return targetIndex >= 0 ? targetIndex : null;
  }

  if (rule.then === "repeat" && rule.repeatStep) {
    const targetIndex = orderedStepIds.indexOf(rule.repeatStep);
    return targetIndex >= 0 ? targetIndex : currentStepIndex;
  }

  // Default: continue linear
  return currentStepIndex + 1;
}
