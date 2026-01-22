/**
 * Engine Selector - Pre-routing pass that decides which execution engine owns the user next
 * 
 * This is the "brain" that determines the best-fit execution engine based on:
 * - Accumulated signals
 * - Accumulated results (calcOutputs, outcomes)
 * - Completion state
 * - Current context
 * 
 * The selector runs BEFORE step routing to determine which engine should handle the next step.
 */

import type { EngineState } from "../runtime/engine-state";
import type { ExecutionEngineId } from "./engine-registry";

/**
 * Select the best-fit execution engine based on current EngineState
 * 
 * Selection logic:
 * - Calculator: If there are numeric signals (cost, loss, profit) or calcOutputs exist
 * - ABC: If there are checkbox/cascading signals or multiple decision points
 * - Learning: Default fallback for comprehension/readiness signals
 * 
 * @param engineState - Current EngineState containing signals, results, and completion state
 * @param currentEngineId - Currently active engine (for continuity)
 * @returns Selected execution engine ID
 */
export function selectExecutionEngine(
  engineState: EngineState,
  currentEngineId: ExecutionEngineId = "learning"
): ExecutionEngineId {
  const {
    accumulatedSignals,
    accumulatedBlockers,
    accumulatedOpportunities,
    calcOutputs,
    completedStepIds,
    totalSteps,
    currentStepIndex,
  } = engineState;

  // Check completion state
  const isComplete = currentStepIndex >= totalSteps;
  const completionRatio = totalSteps > 0 ? completedStepIds.length / totalSteps : 0;

  // Calculator engine signals: numeric/cost-related
  const calculatorSignals = [
    "cost",
    "loss",
    "profit",
    "price",
    "expense",
    "revenue",
    "budget",
    "monthly_cost",
    "total_loss",
    "intent_score",
  ];
  const hasCalculatorSignals = accumulatedSignals.some((signal) =>
    calculatorSignals.some((calcSignal) => signal.toLowerCase().includes(calcSignal))
  );
  const hasCalcOutputs = Object.keys(calcOutputs).length > 0;

  // ABC engine signals: checkbox/cascading/decision-related
  const abcSignals = [
    "checkbox",
    "cascade",
    "decision",
    "choice",
    "multiple",
    "branch",
    "conditional",
  ];
  const hasAbcSignals = accumulatedSignals.some((signal) =>
    abcSignals.some((abcSignal) => signal.toLowerCase().includes(abcSignal))
  );
  const hasMultipleDecisions = accumulatedOpportunities.length > 2 || accumulatedBlockers.length > 2;

  // Learning engine signals: comprehension/readiness
  const learningSignals = [
    "understand",
    "learned",
    "comprehension",
    "readiness",
    "education",
    "explain",
  ];
  const hasLearningSignals = accumulatedSignals.some((signal) =>
    learningSignals.some((learnSignal) => signal.toLowerCase().includes(learnSignal))
  );

  // Selection priority (order matters):
  // 1. Calculator: If numeric data exists or calculator outputs are present
  if (hasCalcOutputs || hasCalculatorSignals) {
    return "calculator";
  }

  // 2. ABC: If cascading/decision signals or multiple decision points
  if (hasAbcSignals || hasMultipleDecisions) {
    return "abc";
  }

  // 3. Learning: Default for comprehension/readiness, or if no clear signal
  if (hasLearningSignals || accumulatedSignals.length === 0) {
    return "learning";
  }

  // 4. Fallback: Maintain current engine for continuity
  return currentEngineId;
}

/**
 * Get selection reason for debugging/explanation
 * Returns why a particular engine was selected
 */
export function getSelectionReason(
  engineState: EngineState,
  selectedEngineId: ExecutionEngineId
): {
  engineId: ExecutionEngineId;
  reasons: string[];
  signals: string[];
  calcOutputs: string[];
} {
  const reasons: string[] = [];
  const { accumulatedSignals, calcOutputs } = engineState;

  if (selectedEngineId === "calculator") {
    if (Object.keys(calcOutputs).length > 0) {
      reasons.push(`Calculator outputs present: ${Object.keys(calcOutputs).join(", ")}`);
    }
    const calcSignals = accumulatedSignals.filter((s) =>
      ["cost", "loss", "profit", "price"].some((term) => s.toLowerCase().includes(term))
    );
    if (calcSignals.length > 0) {
      reasons.push(`Numeric signals detected: ${calcSignals.join(", ")}`);
    }
  } else if (selectedEngineId === "abc") {
    const abcSignals = accumulatedSignals.filter((s) =>
      ["checkbox", "cascade", "decision"].some((term) => s.toLowerCase().includes(term))
    );
    if (abcSignals.length > 0) {
      reasons.push(`Cascading signals detected: ${abcSignals.join(", ")}`);
    }
    if (engineState.accumulatedOpportunities.length > 2) {
      reasons.push(`Multiple decision points (${engineState.accumulatedOpportunities.length} opportunities)`);
    }
  } else {
    // learning
    if (accumulatedSignals.length === 0) {
      reasons.push("No signals detected, using default learning engine");
    } else {
      reasons.push(`Comprehension signals: ${accumulatedSignals.slice(0, 3).join(", ")}`);
    }
  }

  return {
    engineId: selectedEngineId,
    reasons,
    signals: accumulatedSignals,
    calcOutputs: Object.keys(calcOutputs),
  };
}
