/**
 * Next Step Reason - Deterministic explanation of routing decisions
 * First-class output that any screen can render
 * No persistence, no analytics, no API - pure deterministic logic
 */

import type { EngineExplainEvent } from "./engine-explain";

/**
 * NextStepReason - Canonical type for explaining why a particular step was chosen
 * This is the deterministic output that can be rendered by any screen
 */
export type NextStepReason = {
  timestamp: number; // Local timestamp when reason was computed
  flowId: string; // Flow identifier
  engineId: string; // Engine identifier
  currentStep: {
    id: string;
    index: number; // Index in presentation order
    title: string;
  };
  selectedChoice: {
    id: string;
    label: string;
  };
  emitted: {
    signals: string[];
    blockers: string[];
    opportunities: string[];
  };
  routing: {
    mode: "linear" | "rule-matched";
    matchedRuleId?: string;
    explanation: string; // Human-readable explanation
  };
  nextStep: {
    id: string | null;
    index: number | null; // Index in presentation order
    title: string | null;
  };
  meta?: {
    stepPurpose?: "input" | "explain" | "decide" | "summarize";
    stepWeight?: number;
    choiceWeight?: number;
  };
};

/**
 * Convert EngineExplainEvent to NextStepReason
 * Adds human-readable explanations and additional context
 */
export function createNextStepReason(
  explainEvent: EngineExplainEvent,
  flowId: string,
  engineId: string,
  flow: {
    id: string;
    title: string;
    steps: Array<{ id: string; title: string }>;
  },
  presentationOrder?: string[] // Step IDs in presentation order
): NextStepReason {
  // Find current step details
  const currentStepInFlow = flow.steps.find((s) => s.id === explainEvent.currentStepId);
  const currentStepIndex = presentationOrder
    ? presentationOrder.indexOf(explainEvent.currentStepId)
    : flow.steps.findIndex((s) => s.id === explainEvent.currentStepId);

  // Find next step details
  let nextStepId: string | null = explainEvent.nextStepId;
  let nextStepTitle: string | null = null;
  let nextStepIndex: number | null = null;

  if (nextStepId) {
    const nextStepInFlow = flow.steps.find((s) => s.id === nextStepId);
    nextStepTitle = nextStepInFlow?.title ?? null;
    nextStepIndex = presentationOrder
      ? presentationOrder.indexOf(nextStepId)
      : flow.steps.findIndex((s) => s.id === nextStepId);
    if (nextStepIndex < 0) nextStepIndex = null;
  }

  // Build human-readable routing explanation
  let routingExplanation = "";
  if (explainEvent.routing.mode === "linear") {
    routingExplanation = "Proceeding to next step in sequence";
  } else if (explainEvent.routing.matchedRuleId) {
    routingExplanation = `Routing rule matched: ${explainEvent.routing.matchedRuleId}`;
  } else {
    routingExplanation = "Custom routing applied";
  }

  // Find choice label
  const currentStep = flow.steps.find((s) => s.id === explainEvent.currentStepId);
  const choice = currentStep
    ? (currentStep as any).choices?.find((c: any) => c.id === explainEvent.choiceId)
    : null;
  const choiceLabel = choice?.label ?? explainEvent.choiceId;

  return {
    timestamp: Date.now(),
    flowId,
    engineId,
    currentStep: {
      id: explainEvent.currentStepId,
      index: currentStepIndex >= 0 ? currentStepIndex : 0,
      title: currentStepInFlow?.title ?? explainEvent.currentStepId,
    },
    selectedChoice: {
      id: explainEvent.choiceId,
      label: choiceLabel,
    },
    emitted: explainEvent.emitted,
    routing: {
      mode: explainEvent.routing.mode,
      matchedRuleId: explainEvent.routing.matchedRuleId,
      explanation: routingExplanation,
    },
    nextStep: {
      id: nextStepId,
      index: nextStepIndex,
      title: nextStepTitle,
    },
    meta: explainEvent.meta,
  };
}

/**
 * Format NextStepReason as JSON string for copying
 */
export function formatNextStepReasonAsJSON(reason: NextStepReason): string {
  return JSON.stringify(reason, null, 2);
}
