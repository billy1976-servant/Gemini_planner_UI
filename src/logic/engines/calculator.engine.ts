/**
 * Calculator Engine - Numeric outputs only
 * 
 * SEMANTIC BEHAVIOR:
 * - Filters and prioritizes steps that produce numeric outputs
 * - Focuses on data collection, calculation triggers, and numeric outcomes
 * - Only processes steps with: "cost", "loss", "profit", "price", "expense", "revenue", "budget", "monthly_cost", "total_loss", "intent_score" signals
 * - Prioritizes steps with purpose="input" and calcRefs
 */

import type { EducationFlow } from "@/logic/content/flow-loader";
import type { EngineFlow } from "./learning.engine";
import type { PresentationModel } from "./presentation-types";

export function calculatorEngine(flow: EducationFlow): EngineFlow {
  // Calculator engine: Filter to steps that produce numeric outputs
  const numericSignals = [
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
    "time",
    "duration",
    "amount",
    "value",
  ];
  
  // Steps with numeric signals in outcomes
  const numericSteps = flow.steps.filter((step) =>
    step.choices.some((choice) =>
      choice.outcome?.signals?.some((signal) =>
        numericSignals.some((numSignal) => signal.toLowerCase().includes(numSignal))
      )
    )
  );
  
  // Steps with purpose="input" (data collection)
  const inputSteps = flow.steps.filter(
    (step) => step.meta?.purpose === "input" && !numericSteps.includes(step)
  );
  
  // Steps with calcRefs (calculation references)
  const calcRefSteps = flow.steps.filter(
    (step) =>
      flow.calcRefs?.some((ref) => ref.inputs?.some((input) => step.id.includes(input))) &&
      !numericSteps.includes(step) &&
      !inputSteps.includes(step)
  );
  
  // Other steps
  const otherSteps = flow.steps.filter(
    (step) =>
      !numericSteps.includes(step) &&
      !inputSteps.includes(step) &&
      !calcRefSteps.includes(step)
  );
  
  // Reorder: input steps first, then numeric-signal steps, then calc-ref steps, then others
  const reorderedSteps = [...inputSteps, ...numericSteps, ...calcRefSteps, ...otherSteps];
  
  return {
    ...flow,
    steps: reorderedSteps.map((step) => ({
      ...step,
      // Preserve all original data, only reordered by numeric priority
    })),
    // Preserve routing and all other properties
    routing: flow.routing,
    calcRefs: flow.calcRefs,
  };
}

export function calculatorPresentation(flow: EducationFlow): PresentationModel {
  // Calculator engine: Prioritize input steps, then calc-tagged/high-weight steps
  const steps = [...flow.steps];
  
  // Steps with purpose === "input" first
  const inputSteps = steps.filter((step) => step.meta?.purpose === "input");
  
  // Steps tagged "calc" or with higher weight (weight >= 3)
  const calcSteps = steps.filter(
    (step) =>
      !inputSteps.includes(step) &&
      (step.meta?.tags?.includes("calc") || (step.meta?.weight ?? 0) >= 3)
  );
  
  // Other steps
  const otherSteps = steps.filter(
    (step) => !inputSteps.includes(step) && !calcSteps.includes(step)
  );
  
  // Reorder: input steps first, then calc steps, then others
  const stepOrder = [
    ...inputSteps.map((s) => s.id),
    ...calcSteps.map((s) => s.id),
    ...otherSteps.map((s) => s.id),
  ];
  
  // Badges: mark input steps
  const badges: Record<string, string[]> = {};
  inputSteps.forEach((step) => {
    badges[step.id] = ["INPUT"];
  });
  
  return {
    engineId: "calculator",
    title: flow.title,
    stepOrder,
    badges: Object.keys(badges).length > 0 ? badges : undefined,
    notes: ["Data collection and calculation focus"],
  };
}
