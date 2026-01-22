// src/scripts/logic-compiler/emit-flow.ts
// Emits Flow JSON from Blueprint - deterministic transformation

import type { Blueprint, BlueprintStep, BlueprintChoice, BlueprintRouting } from "./blueprint.schema";

// Flow JSON types (matching flow-loader.ts contract)
export type EducationOutcome = {
  signals: string[];
  blockers?: string[];
  opportunities?: string[];
  severity?: "low" | "medium" | "high";
  affects?: string[];
};

export type EducationChoice = {
  id: string;
  label: string;
  kind: "understand" | "unsure" | "more" | "yes" | "no";
  outcome: EducationOutcome;
};

export type EducationStep = {
  id: string;
  title: string;
  body: string;
  image?: string;
  imageAlt?: string;
  choices: EducationChoice[];
};

export type EducationFlow = {
  id: string;
  title: string;
  steps: EducationStep[];
  calcRefs?: Array<{
    id: string;
    inputs?: string[];
    output?: string;
  }>;
};

/**
 * Transform Blueprint Choice to Flow JSON Choice
 */
function transformChoice(choice: BlueprintChoice): EducationChoice {
  // Map emits → outcome
  const outcome: EducationOutcome = {
    signals: choice.emits.signals || [],
    blockers: choice.emits.blockers,
    opportunities: choice.emits.opportunities,
    severity: choice.emits.severity,
    affects: choice.emits.affects,
  };

  return {
    id: choice.id,
    label: choice.label,
    kind: choice.kind,
    outcome,
  };
}

/**
 * Transform Blueprint Step to Flow JSON Step
 */
function transformStep(step: BlueprintStep): EducationStep {
  return {
    id: step.id,
    title: step.title,
    body: step.body,
    image: step.image,
    imageAlt: step.imageAlt,
    choices: step.choices.map(transformChoice),
  };
}

/**
 * Transform Blueprint Routing to Flow JSON Routing
 */
function transformRouting(routing: BlueprintRouting): any {
  return {
    defaultNext: routing.defaultNext,
    rules: routing.rules?.map((rule) => ({
      when: {
        signals: rule.when.signals,
        blockers: rule.when.blockers,
        opportunities: rule.when.opportunities,
      },
      then: rule.then,
      skipTo: rule.skipTo,
      gotoStep: rule.gotoStep,
      repeatStep: rule.repeatStep,
    })),
  };
}

/**
 * Transform Blueprint to Flow JSON
 * Deterministic: same input → same output
 */
export function emitFlow(blueprint: Blueprint): EducationFlow & { routing?: any } {
  const flow: any = {
    id: blueprint.id,
    title: blueprint.title,
    steps: blueprint.steps.map(transformStep),
  };

  // Add routing if present
  if (blueprint.routing) {
    flow.routing = transformRouting(blueprint.routing);
  }

  // Add calcRefs if present (data only, no code)
  if (blueprint.calcRefs && blueprint.calcRefs.length > 0) {
    flow.calcRefs = blueprint.calcRefs.map((ref) => ({
      id: ref.id,
      inputs: ref.inputs,
      output: ref.output,
    }));
  }

  return flow as EducationFlow & { routing?: any };
}

/**
 * Format Flow JSON with consistent indentation
 * Ensures deterministic output
 */
export function formatFlowJSON(flow: EducationFlow & { routing?: any }): string {
  return JSON.stringify(flow, null, 2) + "\n";
}
