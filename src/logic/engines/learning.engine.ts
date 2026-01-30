/**
 * Learning Engine - Comprehension/readiness signals only
 * 
 * SEMANTIC BEHAVIOR:
 * - Filters and prioritizes steps that emit comprehension/readiness signals
 * - Focuses on educational progression, understanding, and knowledge building
 * - Skips or de-prioritizes steps that don't contribute to learning outcomes
 * - Only processes steps with: "understand", "learned", "comprehension", "readiness", "education", "explain" signals
 */

import type { EducationFlow } from "@/logic/flows/flow-loader";
import type { PresentationModel } from "../engines/presentation-types";

export type EngineFlow = EducationFlow;

export function learningEngine(flow: EducationFlow): EngineFlow {
  // Learning engine: Filter to steps that emit comprehension/readiness signals
  const learningSignals = [
    "understand",
    "learned",
    "comprehension",
    "readiness",
    "education",
    "explain",
    "knowledge",
  ];
  
  // Filter steps: prioritize those with learning-related signals
  const learningSteps = flow.steps.filter((step) =>
    step.choices.some((choice) =>
      choice.outcome?.signals?.some((signal) =>
        learningSignals.some((learnSignal) => signal.toLowerCase().includes(learnSignal))
      )
    )
  );
  
  // Include steps without explicit signals but with educational purpose
  const educationalSteps = flow.steps.filter(
    (step) =>
      !learningSteps.includes(step) &&
      (step.meta?.purpose === "explain" || step.meta?.purpose === "summarize")
  );
  
  // Combine: learning-signal steps first, then educational-purpose steps, then others
  const otherSteps = flow.steps.filter(
    (step) => !learningSteps.includes(step) && !educationalSteps.includes(step)
  );
  
  const reorderedSteps = [...learningSteps, ...educationalSteps, ...otherSteps];
  
  return {
    ...flow,
    steps: reorderedSteps.map((step) => ({
      ...step,
      // Preserve all original data, only reordered by learning priority
    })),
    // Preserve routing and all other properties
    routing: flow.routing,
    calcRefs: flow.calcRefs,
  };
}

export function learningPresentation(flow: EducationFlow): PresentationModel {
  // Learning engine: Original order, linear learning path
  return {
    engineId: "learning",
    title: flow.title,
    stepOrder: flow.steps.map((step) => step.id),
    notes: ["Linear learning path"],
  };
}
