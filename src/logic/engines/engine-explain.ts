/**
 * Engine Explain - Pure helper to explain next step decisions
 * No React dependencies, no side effects
 */

import type { EducationFlow } from "@/logic/content/flow-loader";
import { resolveNextStep } from "./flow-router";

export type EngineExplainEvent = {
  currentStepId: string;
  choiceId: string;
  emitted: {
    signals: string[];
    blockers: string[];
    opportunities: string[];
  };
  routing: {
    mode: "linear" | "rule-matched";
    matchedRuleId?: string;
  };
  nextStepId: string | null;
  meta?: {
    stepPurpose?: "input" | "explain" | "decide" | "summarize";
    stepWeight?: number;
    choiceWeight?: number;
  };
};

/**
 * Explain why a particular next step was chosen
 */
export function explainNextStep(
  flow: EducationFlow,
  currentStepIndex: number,
  currentStepId: string,
  choiceId: string,
  choiceOutcome: {
    signals?: string[];
    blockers?: string[];
    opportunities?: string[];
  },
  accumulatedSignals: string[],
  accumulatedBlockers: string[],
  accumulatedOpportunities: string[]
): EngineExplainEvent {
  // Emit the new signals/blockers/opportunities from this choice
  const emitted = {
    signals: choiceOutcome.signals ?? [],
    blockers: choiceOutcome.blockers ?? [],
    opportunities: choiceOutcome.opportunities ?? [],
  };

  // Compute accumulated state after this choice
  const newSignals = [...accumulatedSignals, ...emitted.signals];
  const newBlockers = [...accumulatedBlockers, ...emitted.blockers];
  const newOpportunities = [...accumulatedOpportunities, ...emitted.opportunities];

  // Determine routing mode and matched rule
  const routing = flow.routing;
  let routingMode: "linear" | "rule-matched" = "linear";
  let matchedRuleId: string | undefined = undefined;

  if (routing && routing.rules && routing.rules.length > 0) {
    // Check each rule to see if it matches
    for (let i = 0; i < routing.rules.length; i++) {
      const rule = routing.rules[i];
      if (!rule) continue;

      // Evaluate rule conditions
      const matchesSignals =
        !rule.when?.signals ||
        rule.when.signals.length === 0 ||
        rule.when.signals.every((s) => newSignals.includes(s));

      const matchesBlockers =
        !rule.when?.blockers ||
        rule.when.blockers.length === 0 ||
        rule.when.blockers.some((b) => newBlockers.includes(b));

      const matchesOpportunities =
        !rule.when?.opportunities ||
        rule.when.opportunities.length === 0 ||
        rule.when.opportunities.some((o) => newOpportunities.includes(o));

      if (matchesSignals && matchesBlockers && matchesOpportunities) {
        routingMode = "rule-matched";
        // Use rule.id if present, otherwise derive from index
        matchedRuleId = (rule as any).id || `rule_${i}`;
        break;
      }
    }
  }

  // Resolve next step (using old signature for explain - doesn't need full EngineState)
  // Note: This is for explanation only, actual routing uses the new signature
  // Note: routing variable is already defined above on line 59

  let nextStepIndex: number | null = null;
  
  if (!routing || routing.defaultNext === "linear") {
    nextStepIndex = currentStepIndex + 1;
    nextStepIndex = nextStepIndex < flow.steps.length ? nextStepIndex : null;
  } else if (routing.rules && routing.rules.length > 0) {
    for (let i = 0; i < routing.rules.length; i++) {
      const rule = routing.rules[i];
      if (!rule) continue;
      
      const matchesSignals = !rule.when?.signals || rule.when.signals.length === 0 || rule.when.signals.every((s: string) => newSignals.includes(s));
      const matchesBlockers = !rule.when?.blockers || rule.when.blockers.length === 0 || rule.when.blockers.some((b: string) => newBlockers.includes(b));
      const matchesOpportunities = !rule.when?.opportunities || rule.when.opportunities.length === 0 || rule.when.opportunities.some((o: string) => newOpportunities.includes(o));
      
      if (matchesSignals && matchesBlockers && matchesOpportunities) {
        if (rule.then === "goto" && rule.gotoStep) {
          const targetIndex = flow.steps.findIndex((s) => s.id === rule.gotoStep);
          nextStepIndex = targetIndex >= 0 ? targetIndex : null;
          break;
        }
      }
    }
    
    if (nextStepIndex === null) {
      nextStepIndex = currentStepIndex + 1;
      nextStepIndex = nextStepIndex < flow.steps.length ? nextStepIndex : null;
    }
  }

  // Get next step ID
  const nextStepId =
    nextStepIndex !== null && nextStepIndex < flow.steps.length
      ? flow.steps[nextStepIndex]?.id ?? null
      : null;

  // Extract metadata from current step and choice
  const currentStep = flow.steps[currentStepIndex];
  const choice = currentStep?.choices.find((c) => c.id === choiceId);
  
  const meta: EngineExplainEvent["meta"] = {};
  if (currentStep?.meta) {
    if (currentStep.meta.purpose) meta.stepPurpose = currentStep.meta.purpose;
    if (currentStep.meta.weight !== undefined) meta.stepWeight = currentStep.meta.weight;
  }
  if (choice?.meta?.weight !== undefined) {
    meta.choiceWeight = choice.meta.weight;
  }

  return {
    currentStepId,
    choiceId,
    emitted,
    routing: {
      mode: routingMode,
      matchedRuleId,
    },
    nextStepId,
    meta: Object.keys(meta).length > 0 ? meta : undefined,
  };
}
