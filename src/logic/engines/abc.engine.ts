/**
 * ABC Engine - Checkbox → cascading facts
 * 
 * SEMANTIC BEHAVIOR:
 * - Filters and prioritizes steps with checkbox/cascading logic
 * - Focuses on multiple choices, branching decisions, and conditional flows
 * - Only processes steps with: "checkbox", "cascade", "decision", "choice", "multiple", "branch", "conditional" signals
 * - Prioritizes steps with multiple choices (branching) or purpose="decide"
 */

import type { EducationFlow } from "@/logic/content/flow-loader";
import type { EngineFlow } from "./learning.engine";
import type { PresentationModel } from "./presentation-types";

export function abcEngine(flow: EducationFlow): EngineFlow {
  // ABC engine: Filter to steps with checkbox/cascading logic
  const cascadingSignals = [
    "checkbox",
    "cascade",
    "decision",
    "choice",
    "multiple",
    "branch",
    "conditional",
  ];
  
  // Steps with cascading signals
  const cascadingSteps = flow.steps.filter((step) =>
    step.choices.some((choice) =>
      choice.outcome?.signals?.some((signal) =>
        cascadingSignals.some((cascadeSignal) => signal.toLowerCase().includes(cascadeSignal))
      )
    )
  );
  
  // Steps with multiple choices (branching logic)
  const branchingSteps = flow.steps.filter(
    (step) => step.choices.length > 2 && !cascadingSteps.includes(step)
  );
  
  // Steps with purpose="decide" (decision points)
  const decisionSteps = flow.steps.filter(
    (step) =>
      step.meta?.purpose === "decide" &&
      !cascadingSteps.includes(step) &&
      !branchingSteps.includes(step)
  );
  
  // Other steps
  const otherSteps = flow.steps.filter(
    (step) =>
      !cascadingSteps.includes(step) &&
      !branchingSteps.includes(step) &&
      !decisionSteps.includes(step)
  );
  
  // Reorder: cascading-signal steps first, then branching steps, then decision steps, then others
  // Within each group, sort alphabetically for systematic access
  const sortAlphabetically = (steps: typeof flow.steps) =>
    steps.sort((a, b) => a.title.toLowerCase().localeCompare(b.title.toLowerCase()));
  
  const reorderedSteps = [
    ...sortAlphabetically(cascadingSteps),
    ...sortAlphabetically(branchingSteps),
    ...sortAlphabetically(decisionSteps),
    ...sortAlphabetically(otherSteps),
  ];
  
  return {
    ...flow,
    steps: reorderedSteps.map((step) => ({
      ...step,
      // Preserve all original data, only reordered by cascading priority
    })),
    // Preserve routing and all other properties
    routing: flow.routing,
    calcRefs: flow.calcRefs,
  };
}

export function abcPresentation(flow: EducationFlow): PresentationModel {
  // ABC engine: Sort steps alphabetically by title
  const sortedSteps = [...flow.steps].sort((a, b) => {
    const titleA = a.title.toLowerCase();
    const titleB = b.title.toLowerCase();
    return titleA.localeCompare(titleB);
  });
  
  return {
    engineId: "abc",
    title: flow.title,
    stepOrder: sortedSteps.map((step) => step.id),
    notes: ["Browse/reference ordering"],
  };
}
