/**
 * Group Products By Model
 * 
 * Groups products by their detected base model.
 * Creates a structure where each model contains its variants.
 */

import { BaseModel } from "./detectBaseModels";
import { ExtractedAttributes } from "./extractAttributes";

export interface ProductGroup {
  model: BaseModel;
  variants: Array<{
    product: any;
    attributes: ExtractedAttributes;
    variantSpecs: ExtractedAttributes; // Only variant-specific attributes
  }>;
}

/**
 * Extract variant-specific specs (exclude core specs)
 */
function extractVariantSpecs(
  allAttributes: ExtractedAttributes,
  coreSpecs: ExtractedAttributes
): ExtractedAttributes {
  const variantSpecs: ExtractedAttributes = {};

  for (const key in allAttributes) {
    // Include if it's not in core specs or if it's explicitly a variant field
    if (!(key in coreSpecs)) {
      variantSpecs[key] = allAttributes[key];
    }
  }

  return variantSpecs;
}

/**
 * Group products by their base model
 */
export function groupProductsByModel(
  productsWithAttributes: Array<{ product: any; attributes: ExtractedAttributes }>,
  baseModels: BaseModel[]
): ProductGroup[] {
  const groups: ProductGroup[] = [];

  for (const model of baseModels) {
    const variants = productsWithAttributes
      .filter(({ product }) => {
        const productId = product.id || '';
        return model.productIds.includes(productId);
      })
      .map(({ product, attributes }) => ({
        product,
        attributes,
        variantSpecs: extractVariantSpecs(attributes, model.coreSpecs)
      }));

    groups.push({
      model,
      variants
    });
  }

  return groups;
}
