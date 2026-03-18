/**
 * Detect Variant Dimensions
 * 
 * Detects variant dimensions (color, size, finish, etc.) across products in a model group.
 * Generic and keyword-driven - works across any industry.
 */

import { ProductGroup } from "./groupProductsByModel";

export interface VariantDimension {
  name: string;
  type: string; // 'color', 'size', 'material', 'configuration', etc.
  values: Set<string>;
}

/**
 * Keywords that indicate variant dimensions
 */
const DIMENSION_KEYWORDS: Record<string, string[]> = {
  color: ['color', 'colour', 'hue', 'tint', 'shade', 'paint', 'finish'],
  size: ['size', 'dimension', 'length', 'width', 'height', 'weight', 'capacity', 'volume'],
  material: ['material', 'fabric', 'wood', 'metal', 'plastic', 'leather', 'textile'],
  configuration: ['config', 'configuration', 'setup', 'option', 'package', 'bundle'],
  flavor: ['flavor', 'flavour', 'taste', 'scent', 'aroma', 'fragrance'],
  power: ['power', 'watt', 'wattage', 'voltage', 'current', 'amp', 'amperage'],
  style: ['style', 'design', 'pattern', 'theme', 'edition', 'version'],
  quantity: ['quantity', 'count', 'pack', 'packsize', 'qty', 'amount']
};

/**
 * Normalize field name for matching
 */
function normalizeFieldName(field: string): string {
  return field.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Detect dimension type from field name
 */
function detectDimensionType(field: string): string | null {
  const normalized = normalizeFieldName(field);

  for (const [type, keywords] of Object.entries(DIMENSION_KEYWORDS)) {
    if (keywords.some(keyword => normalized.includes(normalizeFieldName(keyword)))) {
      return type;
    }
  }

  return null;
}

/**
 * Detect variant dimensions for a product group
 */
export function detectVariantDimensions(group: ProductGroup): VariantDimension[] {
  const dimensionMap = new Map<string, Set<string>>();

  // Collect all variant values across all products in the group
  for (const variant of group.variants) {
    for (const key in variant.variantSpecs) {
      const value = variant.variantSpecs[key];
      const dimensionType = detectDimensionType(key);

      if (dimensionType) {
        const dimensionKey = `${dimensionType}:${key}`;
        
        if (!dimensionMap.has(dimensionKey)) {
          dimensionMap.set(dimensionKey, new Set());
        }

        // Add value to dimension
        if (typeof value === 'string') {
          dimensionMap.get(dimensionKey)!.add(value);
        } else if (typeof value === 'number') {
          dimensionMap.get(dimensionKey)!.add(String(value));
        } else if (Array.isArray(value)) {
          value.forEach(v => dimensionMap.get(dimensionKey)!.add(String(v)));
        }
      }
    }
  }

  // Convert to VariantDimension array
  const dimensions: VariantDimension[] = [];

  for (const [dimensionKey, values] of dimensionMap.entries()) {
    // Only include dimensions with multiple values (actual variants)
    if (values.size > 1) {
      const [type, name] = dimensionKey.split(':');
      dimensions.push({
        name,
        type,
        values
      });
    }
  }

  return dimensions;
}

/**
 * Detect variant dimensions for multiple product groups
 */
export function detectVariantDimensionsForGroups(groups: ProductGroup[]): Map<string, VariantDimension[]> {
  const dimensionsMap = new Map<string, VariantDimension[]>();

  for (const group of groups) {
    const dimensions = detectVariantDimensions(group);
    dimensionsMap.set(group.model.id, dimensions);
  }

  return dimensionsMap;
}
