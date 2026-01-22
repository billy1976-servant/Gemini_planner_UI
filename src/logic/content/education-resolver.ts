// src/logic/content/education-resolver.ts
// Engine-owned resolver for education flows
// Loads education content via content-resolver pattern

import { resolveContent } from "./content-resolver";
import type { EducationFlow } from "./education.flow";

/**
 * Resolves education flow content from engine-owned content
 * Returns the full flow definition with steps, choices, and outcomes
 */
export function resolveEducationFlow(): EducationFlow {
  const content = resolveContent("education-flow");
  
  // Type guard to ensure we have an EducationFlow
  if (!content || typeof content !== "object" || !("steps" in content)) {
    throw new Error("Invalid education flow content");
  }
  
  return content as EducationFlow;
}
