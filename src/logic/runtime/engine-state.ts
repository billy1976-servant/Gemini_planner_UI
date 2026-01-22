/**
 * EngineState - Single derived state object computed once per choice
 * Consolidates all step order, progress, signals, and export data
 * No re-derivation elsewhere - single source of truth
 * 
 * CONTRACT-BOUNDARY: Do not change shape without updating SystemContract.ts
 */

import type { EducationFlow } from "../content/flow-loader";
import type { PresentationModel } from "../engines/presentation-types";
import type { EngineStateContract, ExportSliceContract } from "@/system/contracts/SystemContract";

export const ENGINE_STATE_KEY = "engine.engineState";

// EngineState must satisfy EngineStateContract
export type EngineState = EngineStateContract;

export type ExportSlice = ExportSliceContract;

/**
 * Derive EngineState from flow, presentation, outcomes, and current step
 * Called once per choice to compute complete state
 */
export function deriveEngineState(
  flow: EducationFlow,
  presentation: PresentationModel | null,
  currentStepIndex: number,
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
  calcOutputs: Record<string, any> = {},
  engineId: string = "learning"
): EngineState {
  // Get ordered step IDs from presentation or fallback to flow order
  const orderedStepIds = presentation?.stepOrder ?? flow.steps.map((s) => s.id);
  const totalSteps = orderedStepIds.length;

  // Compute completed step IDs (guard against undefined outcomes)
  const safeOutcomes = outcomes ?? [];
  const completedStepIds = safeOutcomes.map((o) => o.stepId);

  // Accumulate signals, blockers, opportunities
  const accumulatedSignals: string[] = [];
  const accumulatedBlockers: string[] = [];
  const accumulatedOpportunities: string[] = [];
  let severityDensity = 0;
  let weightSum = 0;

  // Build export slices and accumulate data
  const exportSlices: ExportSlice[] = [];

  for (const outcome of safeOutcomes) {
    const step = flow.steps.find((s) => s.id === outcome.stepId);
    if (!step) continue;

    // Accumulate signals/blockers/opportunities
    if (outcome.outcome.signals) {
      accumulatedSignals.push(...outcome.outcome.signals);
    }
    if (outcome.outcome.blockers) {
      accumulatedBlockers.push(...outcome.outcome.blockers);
    }
    if (outcome.outcome.opportunities) {
      accumulatedOpportunities.push(...outcome.outcome.opportunities);
    }

    // Accumulate severity density
    if (outcome.outcome.severity === "high") {
      severityDensity += 3;
    } else if (outcome.outcome.severity === "medium") {
      severityDensity += 2;
    } else if (outcome.outcome.severity === "low") {
      severityDensity += 1;
    }

    // Accumulate weights
    const stepWeight = step.meta?.weight ?? 1;
    weightSum += stepWeight;

    const choice = step.choices.find((c) => c.id === outcome.choiceId);
    if (choice) {
      const choiceWeight = choice.meta?.weight ?? 1;
      weightSum += choiceWeight;
    }

    // Build export slice
    exportSlices.push({
      stepId: step.id,
      stepTitle: step.title,
      stepPurpose: step.meta?.purpose ?? "explain",
      stepWeight,
      exportRole: step.meta?.exportRole ?? "supporting",
      choiceId: outcome.choiceId,
      choiceLabel: choice?.label ?? null,
      signals: outcome.outcome.signals ?? [],
      blockers: outcome.outcome.blockers ?? [],
      opportunities: outcome.outcome.opportunities ?? [],
      severity: outcome.outcome.severity ?? null,
    });
  }

  return {
    orderedStepIds,
    currentStepIndex,
    totalSteps,
    completedStepIds,
    accumulatedSignals,
    accumulatedBlockers,
    accumulatedOpportunities,
    severityDensity,
    weightSum,
    calcOutputs,
    engineId,
    exportSlices,
  };
}
