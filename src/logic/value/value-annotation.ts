/**
 * Value Annotation - Post-Compile Annotation Hook
 * 
 * Attaches value impact blocks to compiled JSON flows.
 * This runs after JSON compilation, before rendering/export.
 * 
 * Preserves traceability: fact → assumption → output
 * 
 * CONTRACT-BOUNDARY: Do not change shape without updating SystemContract.ts
 */

import type { ValueTranslationInput, ValueTranslationOutput } from "./value-translation.engine";
import { translateValue } from "./value-translation.engine";
import { getDefaultActiveDimensions } from "./value-dimensions";
import type { EducationFlow } from "../flows/flow-loader";

export interface AnnotatedFlow extends EducationFlow {
  valueAnnotations?: {
    valueImpactBlocks: ValueTranslationOutput["valueImpactBlocks"];
    appliedAssumptions: string[];
    insufficientDataFlags: string[];
    traceability: ValueTranslationOutput["traceability"];
  };
}

/**
 * Annotate a compiled flow with value translation data
 * 
 * This function should be called after JSON compilation, before rendering/export.
 * It attaches value impact blocks to the flow while preserving traceability.
 * 
 * @param flow - The compiled flow JSON
 * @param industryModel - The industry model to use for assumptions
 * @param userIntent - Optional user intent state
 * @returns The flow with value annotations attached
 */
export function annotateFlowWithValue(
  flow: EducationFlow,
  industryModel: ValueTranslationInput["industryModel"],
  userIntent?: ValueTranslationInput["userIntent"]
): AnnotatedFlow {
  // Default active dimensions (non-hidden)
  const activeDimensions = getDefaultActiveDimensions();

  // Prepare value translation input
  const translationInput: ValueTranslationInput = {
    products: [], // No products in flow compilation context
    siteData: {}, // No site data in flow compilation context
    industryModel,
    userIntent: userIntent || {
      industryModel,
      priorities: {},
      context: {},
    },
    activeDimensions,
    userPriorityWeights: userIntent?.priorities,
  };

  // Run value translation
  const translationOutput = translateValue(translationInput);

  // Attach annotations to flow
  const annotatedFlow: AnnotatedFlow = {
    ...flow,
    valueAnnotations: {
      valueImpactBlocks: translationOutput.valueImpactBlocks,
      appliedAssumptions: translationOutput.appliedAssumptions,
      insufficientDataFlags: translationOutput.insufficientDataFlags,
      traceability: translationOutput.traceability,
    },
  };

  return annotatedFlow;
}

/**
 * Check if a flow has value annotations
 */
export function hasValueAnnotations(flow: EducationFlow | AnnotatedFlow): flow is AnnotatedFlow {
  return "valueAnnotations" in flow && flow.valueAnnotations !== undefined;
}
