/**
 * HI Engine Runner - Post-processing engine executor
 * 
 * Runs HI engines (calculator/comparison/decision/shared) AFTER flow completion.
 * These engines process EngineState and generate outputs.
 * 
 * IMPORTANT: This does NOT modify execution engine selection or step routing.
 * These are post-processing engines that analyze completed EngineState.
 */

import type { EngineState } from "@/logic/runtime/engine-state";
import { processDecisionState } from "@/logic/engines/decision/decision.engine";
import { selectExecutionEngine } from "@/logic/engines/shared/engine-selector";
import type { DecisionState } from "@/logic/engines/decision/decision-types";

export type HIEngineId = "calculator" | "comparison" | "decision" | "shared";

export interface HIEngineOutput {
  engineId: HIEngineId;
  outputs: Record<string, any>;
  at: number;
}

export interface HIEngineResult {
  engineId: HIEngineId;
  outputs: Record<string, any>;
  decisionState?: DecisionState;
  selectedExecutionEngine?: string;
  at: number;
}

/**
 * Run HI engine post-processing on completed EngineState
 * 
 * @param engineState - Completed EngineState from flow execution
 * @param hiEngineId - HI engine to run (calculator/comparison/decision/shared)
 * @returns Updated EngineState with HI engine results in engineState.hi field
 */
export function runHIEngines(
  engineState: EngineState,
  hiEngineId: HIEngineId
): EngineState {
  const hiResult: HIEngineResult = {
    engineId: hiEngineId,
    outputs: {},
    at: Date.now(),
  };

  switch (hiEngineId) {
    case "calculator":
      // Calculator post-processing: analyze calcOutputs
      hiResult.outputs = {
        calcOutputs: engineState.calcOutputs,
        calcCount: Object.keys(engineState.calcOutputs).length,
        hasNumericOutputs: Object.keys(engineState.calcOutputs).length > 0,
      };
      break;

    case "comparison":
      // Comparison post-processing: product comparison analysis
      // TODO: Implement when comparison engine is fully integrated
      hiResult.outputs = {
        comparisonReady: true,
        note: "Comparison engine post-processing (stub - to be implemented)",
      };
      break;

    case "decision":
      // Decision post-processing: generate decision recommendations
      const decisionState = processDecisionState(engineState, [], {});
      hiResult.decisionState = decisionState;
      hiResult.outputs = {
        recommendations: decisionState.recommendedNextSteps?.map((s) => s.reason) || [],
        explanations: decisionState.signals || [],
        confidence: 0,
      };
      break;

    case "shared":
      // Shared post-processing: use engine selector to determine best execution engine
      const selectedEngine = selectExecutionEngine(engineState, "learning");
      hiResult.selectedExecutionEngine = selectedEngine;
      hiResult.outputs = {
        selectedExecutionEngine: selectedEngine,
        selectionReason: "Based on accumulated signals and state",
      };
      break;

    default:
      console.warn(`[HIEngineRunner] Unknown HI engine: ${hiEngineId}`);
      hiResult.outputs = {
        error: `Unknown HI engine: ${hiEngineId}`,
      };
  }

  // Return EngineState with HI results attached
  // Note: EngineState type may need to be extended to include hi field
  // For now, we'll return it as-is and the caller can handle the hi field
  return {
    ...engineState,
    // @ts-ignore - hi field will be added to EngineState type if needed
    hi: hiResult,
  };
}
