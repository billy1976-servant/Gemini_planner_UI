/**
 * Compile Products
 * 
 * Main compiler pipeline that:
 * 1. Detects variant patterns across all products
 * 2. Applies variants to individual products
 * 3. Maps images to variants
 */

import { detectVariantPatterns } from "./detectVariantPatterns";
import { applyVariantsToProducts } from "./applyVariantsToProducts";
import { mapVariantImages } from "./mapVariantImages";

export function compileProducts(products: any[]) {
  const variantPatterns = detectVariantPatterns(products);

  const productsWithVariants = applyVariantsToProducts(products, variantPatterns)
    .map(mapVariantImages);

  return {
    variantTypes: Object.keys(variantPatterns),
    products: productsWithVariants
  };
}
