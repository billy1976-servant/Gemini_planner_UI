/**
 * Detect Base Models
 * 
 * Detects base models by identifying products that share core specifications.
 * Uses similarity scoring to group products that are variants of the same base model.
 */

import { ExtractedAttributes } from "./extractAttributes";

export interface BaseModel {
  id: string;
  name: string;
  coreSpecs: ExtractedAttributes;
  productIds: string[];
}

/**
 * Fields that are typically variant-specific (should be excluded from core specs)
 */
const VARIANT_FIELDS = [
  'finish', 'color', 'colour', 'size', 'scent', 'flavor', 'flavour',
  'style', 'version', 'model', 'pack', 'watt', 'power', 'voltage',
  'length', 'width', 'height', 'weight', 'capacity', 'quantity',
  'material', 'texture', 'pattern', 'design', 'edition', 'variant'
];

/**
 * Fields that are always core specs (should always be included)
 */
const CORE_FIELDS = [
  'name', 'title', 'brand', 'category', 'type', 'series', 'line',
  'bodyWood', 'topWood', 'neckWood', 'scaleLength', 'pickups',
  'controls', 'knobs', 'switches', 'input', 'output', 'bypassType',
  'currentDraw', 'impedance', 'channels', 'effects', 'wattage'
];

/**
 * Normalize field name for comparison
 */
function normalizeFieldName(field: string): string {
  return field.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Check if a field is variant-specific
 */
function isVariantField(field: string): boolean {
  const normalized = normalizeFieldName(field);
  return VARIANT_FIELDS.some(vf => normalized.includes(normalizeFieldName(vf)));
}

/**
 * Check if a field is a core spec
 */
function isCoreField(field: string): boolean {
  const normalized = normalizeFieldName(field);
  return CORE_FIELDS.some(cf => normalized.includes(normalizeFieldName(cf)));
}

/**
 * Extract core specs (non-variant attributes) from attributes
 */
function extractCoreSpecs(attributes: ExtractedAttributes): ExtractedAttributes {
  const coreSpecs: ExtractedAttributes = {};

  for (const key in attributes) {
    // Include if it's explicitly a core field, or if it's not a variant field
    if (isCoreField(key) || !isVariantField(key)) {
      coreSpecs[key] = attributes[key];
    }
  }

  return coreSpecs;
}

/**
 * Calculate similarity score between two attribute sets
 * Returns a value between 0 and 1
 */
function calculateSimilarity(
  attrs1: ExtractedAttributes,
  attrs2: ExtractedAttributes
): number {
  const keys1 = new Set(Object.keys(attrs1));
  const keys2 = new Set(Object.keys(attrs2));
  
  // Find common keys
  const commonKeys = Array.from(keys1).filter(k => keys2.has(k));
  
  if (commonKeys.length === 0) return 0;

  // Count matching values
  let matches = 0;
  for (const key of commonKeys) {
    const val1 = attrs1[key];
    const val2 = attrs2[key];
    
    // Compare values (handle arrays and primitives)
    if (Array.isArray(val1) && Array.isArray(val2)) {
      const set1 = new Set(val1.map(String));
      const set2 = new Set(val2.map(String));
      if (set1.size === set2.size && Array.from(set1).every(v => set2.has(v))) {
        matches++;
      }
    } else if (String(val1) === String(val2)) {
      matches++;
    }
  }

  return matches / commonKeys.length;
}

/**
 * Detect base models from products with extracted attributes
 */
export function detectBaseModels(
  productsWithAttributes: Array<{ product: any; attributes: ExtractedAttributes }>
): BaseModel[] {
  const models: BaseModel[] = [];
  const processed = new Set<string>();

  for (let i = 0; i < productsWithAttributes.length; i++) {
    const { product, attributes } = productsWithAttributes[i];
    const productId = product.id || `prod_${i}`;

    if (processed.has(productId)) continue;

    const coreSpecs = extractCoreSpecs(attributes);
    const modelProducts = [productId];
    processed.add(productId);

    // Find similar products (same base model)
    for (let j = i + 1; j < productsWithAttributes.length; j++) {
      const { product: otherProduct, attributes: otherAttrs } = productsWithAttributes[j];
      const otherId = otherProduct.id || `prod_${j}`;

      if (processed.has(otherId)) continue;

      const otherCoreSpecs = extractCoreSpecs(otherAttrs);
      const similarity = calculateSimilarity(coreSpecs, otherCoreSpecs);

      // If similarity is high enough (>= 0.7), consider them the same base model
      if (similarity >= 0.7) {
        modelProducts.push(otherId);
        processed.add(otherId);
      }
    }

    // Generate model name from first product
    const modelName = product.name || product.title || `Model ${models.length + 1}`;
    
    models.push({
      id: `model_${models.length + 1}`,
      name: modelName,
      coreSpecs,
      productIds: modelProducts
    });
  }

  return models;
}
