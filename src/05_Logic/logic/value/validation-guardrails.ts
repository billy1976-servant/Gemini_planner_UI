/**
 * Validation Guardrails
 * 
 * Ensures all conclusions meet minimum requirements:
 * - At least one site fact OR one research fact
 * - Research facts must always show citation
 * - Graceful degradation if research unavailable
 * 
 * CONTRACT-BOUNDARY: Do not change shape without updating SystemContract.ts
 */

import type { ValueImpactBlock } from "@/logic/engines/comparison/value-translation.engine";
import type { ResearchFact } from "../research/research-fact-library";
import { getResearchFact } from "../research/research-fact-library";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate a value impact block
 * 
 * Rules:
 * - Must have at least one site fact OR one research fact
 * - Research facts must always show citation
 * 
 * @param block - Value impact block to validate
 * @param researchFactIds - Optional research fact IDs to check
 * @returns Validation result
 */
export function validateValueImpactBlock(
  block: ValueImpactBlock,
  researchFactIds?: string[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Guardrail 1: Must have at least one site fact OR one research fact
  const hasSiteFact = block.proof?.facts && block.proof.facts.length > 0;
  const hasResearchFact = researchFactIds && researchFactIds.length > 0;

  if (!hasSiteFact && !hasResearchFact) {
    errors.push("Block must have at least one site fact OR one research fact");
  }

  // Guardrail 2: Research facts must always show citation
  if (researchFactIds) {
    for (const factId of researchFactIds) {
      const researchFact = getResearchFact(factId);
      if (!researchFact) {
        errors.push(`Research fact ${factId} not found in library`);
      } else if (!researchFact.sourceURL || researchFact.sourceURL.trim().length === 0) {
        errors.push(`Research fact ${factId} missing source URL citation`);
      } else if (!researchFact.sourceLabel || researchFact.sourceLabel.trim().length === 0) {
        warnings.push(`Research fact ${factId} missing source label`);
      }
    }
  }

  // Guardrail 3: Source citation must be present
  if (!block.source.citation.url || block.source.citation.url.trim().length === 0) {
    errors.push("Block source citation missing URL");
  }

  if (!block.source.citation.label || block.source.citation.label.trim().length === 0) {
    warnings.push("Block source citation missing label");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate ranked conclusions
 * 
 * Ensures:
 * - Primary conclusion (rank 1) exists
 * - All conclusions are valid
 * - Research citations are present
 * 
 * @param conclusions - Ranked conclusions to validate
 * @returns Validation result
 */
export function validateRankedConclusions(
  conclusions: Array<{
    rank: number;
    valueImpactBlock: ValueImpactBlock;
    supportingFacts: {
      siteFacts: string[];
      assumptions: string[];
      researchFacts: string[];
    };
  }>
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (conclusions.length === 0) {
    warnings.push("No conclusions generated");
    return { isValid: true, errors, warnings };
  }

  // Check for primary conclusion
  const primaryConclusion = conclusions.find((c) => c.rank === 1);
  if (!primaryConclusion) {
    errors.push("No primary conclusion (rank 1) found");
  }

  // Validate each conclusion
  conclusions.forEach((conclusion, index) => {
    const validation = validateValueImpactBlock(
      conclusion.valueImpactBlock,
      conclusion.supportingFacts.researchFacts
    );

    if (!validation.isValid) {
      errors.push(`Conclusion ${index + 1} (rank ${conclusion.rank}): ${validation.errors.join(", ")}`);
    }

    warnings.push(...validation.warnings.map((w) => `Conclusion ${index + 1}: ${w}`));
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Graceful degradation: Remove invalid blocks
 * 
 * If research unavailable, remove blocks that require research
 * but keep blocks that only need site facts.
 * 
 * @param blocks - Value impact blocks to filter
 * @param requireResearch - Whether research is required
 * @returns Filtered blocks
 */
export function degradeGracefully(
  blocks: ValueImpactBlock[],
  requireResearch: boolean = false
): ValueImpactBlock[] {
  if (!requireResearch) {
    return blocks; // No degradation needed
  }

  // Filter out blocks that require research but don't have it
  return blocks.filter((block) => {
    const hasResearch = block.proof?.assumptions && block.proof.assumptions.length > 0;
    const hasSiteFact = block.proof?.facts && block.proof.facts.length > 0;

    // Keep if has research OR has site fact (don't require both)
    return hasResearch || hasSiteFact;
  });
}
