/**
 * Build Normalized Models
 * 
 * Builds the final normalized model structure with shared specs,
 * variant options, variant-specific images, and pricing.
 */

import { ProductGroup } from "./groupProductsByModel";
import { VariantDimension } from "./detectVariantDimensions";
import { VariantImageMap } from "./mapImagesToVariants";

export interface VariantOption {
  id: string;
  name: string;
  specs: Record<string, any>;
  images: string[];
  price?: {
    amount: number;
    currency: string;
  };
  url?: string;
}

export interface NormalizedModel {
  id: string;
  name: string;
  coreSpecs: Record<string, any>;
  dimensions: VariantDimension[];
  variants: VariantOption[];
  defaultImages: string[];
}

/**
 * Build normalized model from product group
 */
export function buildNormalizedModel(
  group: ProductGroup,
  dimensions: VariantDimension[],
  imageMaps: Map<string, VariantImageMap>
): NormalizedModel {
  const variants: VariantOption[] = [];
  const allImages = new Set<string>();

  // Build variant options
  for (const variant of group.variants) {
    const product = variant.product;
    const productId = product.id || '';
    const imageMap = imageMaps.get(productId) || {};

    // Collect all images for this variant
    const variantImages: string[] = [];
    for (const images of Object.values(imageMap)) {
      variantImages.push(...images);
      images.forEach(img => allImages.add(img));
    }

    // If no variant-specific images, use product images
    if (variantImages.length === 0 && product.images) {
      variantImages.push(...product.images);
      product.images.forEach((img: string) => allImages.add(img));
    }

    // Build variant name from dimension values
    const variantNameParts: string[] = [];
    for (const dimension of dimensions) {
      const value = variant.variantSpecs[dimension.name];
      if (value) {
        variantNameParts.push(String(value));
      }
    }
    const variantName = variantNameParts.length > 0
      ? variantNameParts.join(' / ')
      : product.name || product.title || 'Variant';

    // Extract price
    const price = product.price
      ? {
          amount: product.price.amount || 0,
          currency: product.price.currency || 'USD'
        }
      : undefined;

    variants.push({
      id: productId,
      name: variantName,
      specs: variant.variantSpecs,
      images: variantImages.length > 0 ? variantImages : (product.images || []),
      price,
      url: product.url || product.href
    });
  }

  // Get default images (first variant's images or first product's images)
  const defaultImages = variants.length > 0 && variants[0].images.length > 0
    ? variants[0].images
    : Array.from(allImages).slice(0, 5);

  return {
    id: group.model.id,
    name: group.model.name,
    coreSpecs: group.model.coreSpecs,
    dimensions: dimensions.map(d => ({
      name: d.name,
      type: d.type,
      values: d.values // Keep as Set<string>
    })),
    variants,
    defaultImages
  };
}

/**
 * Build normalized models from product groups
 */
export function buildNormalizedModels(
  groups: ProductGroup[],
  dimensionsMap: Map<string, VariantDimension[]>,
  imageMapsMap: Map<string, Map<string, VariantImageMap>>
): NormalizedModel[] {
  const models: NormalizedModel[] = [];

  for (const group of groups) {
    const dimensions = dimensionsMap.get(group.model.id) || [];
    const imageMaps = imageMapsMap.get(group.model.id) || new Map();
    const model = buildNormalizedModel(group, dimensions, imageMaps);
    models.push(model);
  }

  return models;
}
