/**
 * Map Images To Variants
 * 
 * Maps product images to specific variants based on image URLs and variant values.
 * Uses pattern matching to associate images with variant dimensions.
 */

import { ProductGroup } from "./groupProductsByModel";
import { VariantDimension } from "./detectVariantDimensions";

export interface VariantImageMap {
  [variantKey: string]: string[]; // Maps variant value to image URLs
}

/**
 * Normalize string for matching
 */
function normalizeForMatching(str: string): string {
  return str.toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Check if image URL matches a variant value
 */
function imageMatchesVariant(imageUrl: string, variantValue: string): boolean {
  const normalizedUrl = normalizeForMatching(imageUrl);
  const normalizedValue = normalizeForMatching(variantValue);

  // Direct match
  if (normalizedUrl.includes(normalizedValue)) {
    return true;
  }

  // Split variant value into words and check if all words appear in URL
  const valueWords = normalizedValue.split('-').filter(w => w.length > 2);
  if (valueWords.length > 0 && valueWords.every(word => normalizedUrl.includes(word))) {
    return true;
  }

  return false;
}

/**
 * Map images to variants for a product group
 */
export function mapImagesToVariants(
  group: ProductGroup,
  dimensions: VariantDimension[]
): Map<string, VariantImageMap> {
  const variantImageMaps = new Map<string, VariantImageMap>();

  for (const variant of group.variants) {
    const product = variant.product;
    const images = product.images || [];
    const imageMap: VariantImageMap = {};

    // For each dimension, try to match images to variant values
    for (const dimension of dimensions) {
      const variantValue = variant.variantSpecs[dimension.name];
      
      if (variantValue) {
        const valueStr = String(variantValue);
        const matchingImages = images.filter((img: string) =>
          imageMatchesVariant(img, valueStr)
        );

        if (matchingImages.length > 0) {
          imageMap[`${dimension.name}:${valueStr}`] = matchingImages;
        }
      }
    }

    // If no dimension-specific images found, use all images as default
    if (Object.keys(imageMap).length === 0 && images.length > 0) {
      imageMap['default'] = images;
    }

    variantImageMaps.set(product.id || '', imageMap);
  }

  return variantImageMaps;
}

/**
 * Map images to variants for multiple product groups
 */
export function mapImagesToVariantsForGroups(
  groups: ProductGroup[],
  dimensionsMap: Map<string, VariantDimension[]>
): Map<string, Map<string, VariantImageMap>> {
  const allImageMaps = new Map<string, Map<string, VariantImageMap>>();

  for (const group of groups) {
    const dimensions = dimensionsMap.get(group.model.id) || [];
    const imageMaps = mapImagesToVariants(group, dimensions);
    allImageMaps.set(group.model.id, imageMaps);
  }

  return allImageMaps;
}
