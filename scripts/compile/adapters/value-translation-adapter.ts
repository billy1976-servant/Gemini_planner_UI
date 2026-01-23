/**
 * Value Translation Adapter - Wraps existing value translation engine
 * 
 * Reuses: translateValue, getDefaultActiveDimensions
 */

import { translateValue } from "../../../src/logic/value/value-translation.engine";
import { getDefaultActiveDimensions } from "../../../src/logic/value/value-dimensions";
import type { ProductGraph } from "../../../src/logic/products/product-types";
import type { ResearchBundle, ValueModel } from "../compile-website";

/**
 * Run value translation on product graph with research bundle
 */
export async function runValueTranslation(
  productGraph: ProductGraph,
  researchBundle: ResearchBundle
): Promise<ValueModel> {
  // Determine industry model from product graph
  let industryModel: "cleanup" | "skincare" | "instruments" | "education" | "events" = "skincare";
  
  for (const product of productGraph.products) {
    const category = product.category.toLowerCase();
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
    if (product.attributes.ph || product.attributes.pH) {
      siteData.ph_value = product.attributes.ph?.value || product.attributes.pH?.value;
    }
    if (product.attributes.materials || product.attributes.construction) {
      siteData.materials = product.attributes.materials?.value || product.attributes.construction?.value;
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
      priorities: {},
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
