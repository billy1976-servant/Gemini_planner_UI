/**
 * Summary Processor - AFTERMATH PROCESSOR (post-engine)
 * 
 * SEMANTIC BEHAVIOR:
 * - Consumes EngineState (does NOT transform flows or route steps)
 * - Generates summaries and overviews based on accumulated state
 * - Groups completed steps into key points and supporting details
 * - Never participates in step routing - only processes completed EngineState
 * 
 * IMPORTANT: This is NOT an execution engine. It is a downstream processor.
 */

import type { EngineState } from "../runtime/engine-state";
import type { ExportSlice } from "../runtime/engine-state";

export type SummaryOutput = {
  keyPoints: SummaryPoint[];
  supportingDetails: SummaryPoint[];
  completionStats: {
    totalSteps: number;
    completedSteps: number;
    completionRatio: number;
    severityDensity: number;
    weightSum: number;
  };
  topSignals: string[];
  topBlockers: string[];
  topOpportunities: string[];
};

export type SummaryPoint = {
  stepId: string;
  stepTitle: string;
  stepPurpose: "input" | "explain" | "decide" | "summarize";
  stepWeight: number;
  signals: string[];
  blockers: string[];
  opportunities: string[];
  severity: "low" | "medium" | "high" | null;
  exportRole: "primary" | "supporting";
};

/**
 * Process EngineState to generate summary output
 * This is called AFTER execution engines complete, not during step routing
 * 
 * @param engineState - Completed EngineState from execution engines
 * @returns SummaryOutput with key points, details, and completion stats
 */
export function processSummaryState(engineState: EngineState): SummaryOutput {
  // Consume EngineState to build summary
  const {
    exportSlices,
    totalSteps,
    completedStepIds,
    accumulatedSignals,
    accumulatedBlockers,
    accumulatedOpportunities,
    severityDensity,
    weightSum,
  } = engineState;

  // Calculate scores for each export slice (weight + density)
  const sliceScores = exportSlices.map((slice) => {
    const density =
      slice.signals.length + slice.blockers.length + slice.opportunities.length;
    return {
      slice,
      score: slice.stepWeight + density,
    };
  });

  // Sort by score (highest first)
  sliceScores.sort((a, b) => b.score - a.score);

  // Top 3 are "Key Points", rest are "Supporting Details"
  const keyPointSlices = sliceScores.slice(0, 3).map((s) => s.slice);
  const supportingSlices = sliceScores.slice(3).map((s) => s.slice);

  // Convert to SummaryPoint format
  const toSummaryPoint = (slice: ExportSlice): SummaryPoint => ({
    stepId: slice.stepId,
    stepTitle: slice.stepTitle,
    stepPurpose: slice.stepPurpose,
    stepWeight: slice.stepWeight,
    signals: slice.signals,
    blockers: slice.blockers,
    opportunities: slice.opportunities,
    severity: slice.severity,
    exportRole: slice.exportRole,
  });

  // Get top signals/blockers/opportunities (most frequent or highest weight)
  const topSignals = [...new Set(accumulatedSignals)].slice(0, 5);
  const topBlockers = [...new Set(accumulatedBlockers)].slice(0, 5);
  const topOpportunities = [...new Set(accumulatedOpportunities)].slice(0, 5);

  return {
    keyPoints: keyPointSlices.map(toSummaryPoint),
    supportingDetails: supportingSlices.map(toSummaryPoint),
    completionStats: {
      totalSteps,
      completedSteps: completedStepIds.length,
      completionRatio: totalSteps > 0 ? completedStepIds.length / totalSteps : 0,
      severityDensity,
      weightSum,
    },
    topSignals,
    topBlockers,
    topOpportunities,
  };
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use processSummaryState() instead - this is an aftermath processor, not a flow transformer
 */
export function summaryEngine(flow: any): any {
  console.warn(
    "[SummaryProcessor] summaryEngine() called - Summary is an aftermath processor, not a flow transformer. " +
    "Use processSummaryState() to consume EngineState instead."
  );
  // Return flow as-is (no transformation - summary processor doesn't transform flows)
  return flow;
}

/**
 * Legacy presentation function for backward compatibility
 * @deprecated Summary processor does not generate presentation models - it generates SummaryOutput
 */
export function summaryPresentation(flow: any): any {
  console.warn(
    "[SummaryProcessor] summaryPresentation() called - Summary is an aftermath processor. " +
    "It generates SummaryOutput, not PresentationModel."
  );
  // Return minimal presentation (for compatibility only)
  return {
    engineId: "summary",
    title: flow.title,
    stepOrder: flow.steps.map((s: any) => s.id),
    notes: ["Aftermath processor - generates summaries from EngineState"],
  };
}
