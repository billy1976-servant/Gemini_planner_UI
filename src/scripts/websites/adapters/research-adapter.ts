/**
 * Research Adapter - Attaches research facts to product graph
 *
 * Reuses: getResearchFactsByIndustry, getIndustryModel
 */

import { getResearchFactsByIndustry } from "@/logic/research/research-fact-library";
import { getIndustryModel } from "@/logic/value/assumption-library";
import type { ProductGraph } from "@/logic/products/product-types";
import type { ResearchBundle } from "../compile-website";

/**
 * Attach research facts to product graph
 */
export async function attachResearch(
  productGraph: ProductGraph
): Promise<ResearchBundle> {
  const researchFacts: string[] = [];
  const bindings: Record<string, string[]> = {};

  // Determine industry from product graph
  // Simple heuristic: check product categories
  const industries: string[] = [];

  // Check if products match known industries
  for (const product of productGraph.products) {
    const category = (product.category || "").toLowerCase();
    if (category.includes("soap") || category.includes("skincare")) {
      industries.push("skincare");
    } else if (category.includes("guitar") || category.includes("instrument")) {
      industries.push("instruments");
    }
  }

  // Default to skincare if no match
  const industry = industries.length > 0 ? industries[0] : "skincare";

  // Get research facts for this industry
  const facts = getResearchFactsByIndustry(industry as any);
  researchFacts.push(...facts.map((f) => f.id));

  // Get industry model and bind research facts to assumptions
  try {
    const industryModel = getIndustryModel(industry as any);
    if (industryModel) {
      for (const [varId, variable] of Object.entries(industryModel.variables)) {
        if (variable.researchFactIds && variable.researchFactIds.length > 0) {
          bindings[varId] = variable.researchFactIds;
        }
      }
    }
  } catch {
    // Industry model not found, continue without bindings
  }

  return {
    researchFacts: [...new Set(researchFacts)],
    bindings,
  };
}

