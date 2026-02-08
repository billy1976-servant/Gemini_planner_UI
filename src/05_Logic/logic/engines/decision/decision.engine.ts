/**
 * Decision Processor - AFTERMATH PROCESSOR (post-engine)
 * 
 * SEMANTIC BEHAVIOR:
 * - Consumes EngineState (does NOT transform flows or route steps)
 * - Generates recommendations and explanations based on accumulated state
 * - Analyzes signals, blockers, opportunities to produce decision insights
 * - Never participates in step routing - only processes completed EngineState
 * 
 * IMPORTANT: This is NOT an execution engine. It is a downstream processor.
 */

import type { EngineState } from "../../runtime/engine-state";
import type { DecisionState } from "./decision-types";
import { aggregateDecisionState } from "./aggregate";

/**
 * Process EngineState to generate decision recommendations
 * This is called AFTER execution engines complete, not during step routing
 * 
 * @param engineState - Completed EngineState from execution engines
 * @param outcomes - Raw outcomes array (for backward compatibility)
 * @param context - Additional context for decision generation
 * @returns DecisionState with recommendations and explanations
 */
export function processDecisionState(
  engineState: EngineState,
  outcomes: any[] = [],
  context: Record<string, any> = {}
): DecisionState {
  // Consume EngineState to build decision insights
  const {
    accumulatedSignals,
    accumulatedBlockers,
    accumulatedOpportunities,
    severityDensity,
    weightSum,
    calcOutputs,
    exportSlices,
  } = engineState;

  // Convert exportSlices to outcomes format for aggregateDecisionState
  const outcomesFromSlices = exportSlices.map((slice) => ({
    stepId: slice.stepId,
    choiceId: slice.choiceId,
    outcome: {
      signals: slice.signals,
      blockers: slice.blockers,
      opportunities: slice.opportunities,
      severity: slice.severity,
    },
  }));

  // Merge with provided outcomes
  const allOutcomes = [...outcomes, ...outcomesFromSlices];

  // Generate DecisionState from accumulated EngineState
  const decisionState = aggregateDecisionState(allOutcomes, calcOutputs, {
    ...context,
    severityDensity,
    weightSum,
    totalSteps: engineState.totalSteps,
    completedSteps: engineState.completedStepIds.length,
  });

  return decisionState;
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use processDecisionState() instead - this is an aftermath processor, not a flow transformer
 */
export function decisionEngine(flow: any): any {
  console.warn(
    "[DecisionProcessor] decisionEngine() called - Decision is an aftermath processor, not a flow transformer. " +
    "Use processDecisionState() to consume EngineState instead."
  );
  // Return flow as-is (no transformation - decision processor doesn't transform flows)
  return flow;
}

/**
 * Legacy presentation function for backward compatibility
 * @deprecated Decision processor does not generate presentation models - it generates DecisionState
 */
export function decisionPresentation(flow: any): any {
  console.warn(
    "[DecisionProcessor] decisionPresentation() called - Decision is an aftermath processor. " +
    "It generates DecisionState, not PresentationModel."
  );
  // Return minimal presentation (for compatibility only)
  return {
    engineId: "decision",
    title: flow.title,
    stepOrder: flow.steps.map((s: any) => s.id),
    notes: ["Aftermath processor - generates recommendations from EngineState"],
  };
}
