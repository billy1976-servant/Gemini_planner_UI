// src/scripts/logic-compiler/blueprint.schema.ts
// Blueprint input schema - maps directly to Flow JSON contract
// No new runtime concepts, only declarative mapping

/**
 * Blueprint Choice - maps to EducationChoice
 */
export type BlueprintChoice = {
  id: string;
  label: string;
  kind: "understand" | "unsure" | "more" | "yes" | "no";
  emits: {
    signals?: string[];
    blockers?: string[];
    opportunities?: string[];
    severity?: "low" | "medium" | "high";
    affects?: string[];
  };
};

/**
 * Blueprint Step - maps to EducationStep
 */
export type BlueprintStep = {
  id: string;
  title: string;
  body: string;
  image?: string;
  imageAlt?: string;
  choices: BlueprintChoice[];
};

/**
 * Blueprint Routing Rule - maps to RoutingRule
 */
export type BlueprintRoutingRule = {
  when: {
    signals?: string[];
    blockers?: string[];
    opportunities?: string[];
  };
  then: "skip" | "goto" | "repeat";
  skipTo?: string; // step id
  gotoStep?: string; // step id
  repeatStep?: string; // step id
};

/**
 * Blueprint Routing - maps to FlowRouting
 */
export type BlueprintRouting = {
  defaultNext: "linear" | "signal-based";
  rules?: BlueprintRoutingRule[];
};

/**
 * Blueprint View Block - for immediateView/expandedView/exportView
 * These are declarative content blocks that map to UIBlock/DocumentBlock
 */
export type BlueprintViewBlock = {
  type: string; // e.g., "alert", "opportunity", "signal", "explainer", "accordion", "summary", "steps", "actions"
  title: string;
  content?: string;
  items?: string[];
  sections?: Array<{
    title: string;
    content: string;
    expanded?: boolean;
  }>;
};

/**
 * Blueprint Views - declarative content for outputs
 */
export type BlueprintViews = {
  immediateView?: BlueprintViewBlock[];
  expandedView?: BlueprintViewBlock[];
  exportView?: BlueprintViewBlock[];
};

/**
 * Blueprint Calculation Reference
 * References a named calculation in calc-registry, not inline code
 */
export type BlueprintCalcRef = {
  id: string; // calc registry key
  inputs?: string[]; // state keys to pass as inputs
  output?: string; // state key to store result
};

/**
 * Blueprint Document - root schema
 * Maps directly to Flow JSON without new runtime concepts
 */
export type Blueprint = {
  id: string;
  title: string;
  steps: BlueprintStep[];
  routing?: BlueprintRouting;
  views?: BlueprintViews; // Optional: declarative view content
  calcRefs?: BlueprintCalcRef[]; // Optional: calculation references
};

/**
 * Runtime validator (basic structure check)
 */
export function validateBlueprint(blueprint: any): blueprint is Blueprint {
  if (!blueprint || typeof blueprint !== "object") {
    return false;
  }

  if (!blueprint.id || typeof blueprint.id !== "string") {
    return false;
  }

  if (!blueprint.title || typeof blueprint.title !== "string") {
    return false;
  }

  if (!Array.isArray(blueprint.steps) || blueprint.steps.length === 0) {
    return false;
  }

  // Validate each step
  for (const step of blueprint.steps) {
    if (!step.id || !step.title || !step.body) {
      return false;
    }
    if (!Array.isArray(step.choices) || step.choices.length === 0) {
      return false;
    }
    // Validate each choice
    for (const choice of step.choices) {
      if (!choice.id || !choice.label || !choice.kind) {
        return false;
      }
      if (!choice.emits || typeof choice.emits !== "object") {
        return false;
      }
      if (!Array.isArray(choice.emits.signals || [])) {
        return false;
      }
    }
  }

  // Validate routing if present
  if (blueprint.routing) {
    if (blueprint.routing.defaultNext !== "linear" && blueprint.routing.defaultNext !== "signal-based") {
      return false;
    }
    if (blueprint.routing.rules) {
      for (const rule of blueprint.routing.rules) {
        if (!rule.when || !rule.then) {
          return false;
        }
        if (rule.then === "skip" && !rule.skipTo) {
          return false;
        }
        if (rule.then === "goto" && !rule.gotoStep) {
          return false;
        }
        if (rule.then === "repeat" && !rule.repeatStep) {
          return false;
        }
      }
    }
  }

  return true;
}
