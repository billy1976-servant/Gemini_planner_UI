/**
 * Value Translation Adapter - Wraps existing value translation engine
 *
 * Reuses: translateValue, getDefaultActiveDimensions
 */

import { translateValue } from "@/logic/engines/comparison/value-translation.engine";
import { getDefaultActiveDimensions } from "@/logic/engines/comparison/value-dimensions";
import type { ProductGraph } from "@/logic/products/product-types";
import type { ResearchBundle, ValueModel } from "../compile-website";

/**
 * Run value translation on product graph with research bundle
 */
export async function runValueTranslation(
  productGraph: ProductGraph,
  researchBundle: ResearchBundle
): Promise<ValueModel> {
  // Determine industry model from product graph
  let industryModel:
    | "cleanup"
    | "skincare"
    | "instruments"
    | "education"
    | "events" = "skincare";

  for (const product of productGraph.products) {
    const category = (product.category || "").toLowerCase();
    if (category.includes("guitar") || category.includes("instrument")) {
      industryModel = "instruments";
      break;
    } else if (category.includes("soap") || category.includes("skincare")) {
      industryModel = "skincare";
      break;
    }
  }

  // Prepare site data from product graph
  const siteData: Record<string, any> = {};
  if (productGraph.products.length > 0) {
    const product = productGraph.products[0];
    siteData.product_name = product.name;
    siteData.brand = product.brand;
    siteData.category = product.category;

    // Extract attributes that might be relevant
    const attrs: any = product.attributes || {};
    if (attrs.ph || attrs.pH) {
      siteData.ph_value = attrs.ph?.value || attrs.pH?.value;
    }
    if (attrs.materials || attrs.construction) {
      siteData.materials =
        attrs.materials?.value || attrs.construction?.value;
    }
  }

  // Get active dimensions
  const activeDimensions = getDefaultActiveDimensions();

  // Run value translation
  const translationOutput = translateValue({
    products: productGraph.products,
    siteData,
    industryModel,
    userIntent: {
      industryModel,
      // Neutral priority profile across all value dimensions
      priorities: {
        time: 0,
        effort: 0,
        risk: 0,
        confidence: 0,
        experience: 0,
        quality: 0,
        health: 0,
        money: 0,
      },
      context: {},
    },
    activeDimensions,
  });

  return {
    rankedValueConclusions: translationOutput.rankedValueConclusions,
    valueImpactBlocks: translationOutput.valueImpactBlocks,
    appliedAssumptions: translationOutput.appliedAssumptions,
    appliedResearchFacts: translationOutput.appliedResearchFacts,
  };
}

