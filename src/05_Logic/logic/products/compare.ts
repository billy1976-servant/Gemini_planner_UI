/**
 * Cross-Comparison Engine - Compare products with strict and loose matching
 * 
 * Functions:
 * - buildComparisonMatrix(products, mode:"strict"|"loose")
 * - findSimilarities(products, topN)
 * - findDifferences(products, topN)
 * 
 * Rules:
 * - Strict: compare exact canonical keys and exact values
 * - Loose: compare grouped attributes (dictionary group + normalized enums)
 * - Similarities: attributes where most products share same value
 * - Differences: attributes where values vary the most
 * - Always output with sources (so UI can show expandable "why")
 */

import type {
  Product,
  ComparisonMatrix,
  AttributeComparison,
  AttributeValue,
  Source,
} from "./product-types";
import { DEFAULT_ATTRIBUTE_DICTIONARY } from "./product-normalizer";
import type { AttributeDictionary } from "./product-types";

/**
 * Build comparison matrix for products
 */
export function buildComparisonMatrix(
  products: Product[],
  mode: "strict" | "loose" = "strict",
  dictionary: AttributeDictionary[] = DEFAULT_ATTRIBUTE_DICTIONARY
): ComparisonMatrix {
  if (products.length < 2) {
    return {
      products,
      mode,
      similarities: [],
      differences: [],
      generatedAt: new Date().toISOString(),
    };
  }
  
  // Collect all attribute keys across all products
  const allKeys = new Set<string>();
  products.forEach((product) => {
    Object.keys(product.attributes).forEach((key) => allKeys.add(key));
  });
  
  // Build attribute comparisons
  const comparisons: AttributeComparison[] = [];
  
  for (const key of allKeys) {
    const comparison = compareAttribute(products, key, mode, dictionary);
    if (comparison) {
      comparisons.push(comparison);
    }
  }
  
  // Calculate similarity scores
  comparisons.forEach((comp) => {
    comp.similarity = calculateSimilarity(comp);
  });
  
  // Sort by similarity (descending for similarities, ascending for differences)
  const sorted = [...comparisons].sort((a, b) => b.similarity - a.similarity);
  
  // Find similarities (high similarity scores)
  const similarities = sorted.filter((c) => c.similarity >= 0.7);
  
  // Find differences (low similarity scores)
  const differences = sorted.filter((c) => c.similarity < 0.7);
  
  return {
    products,
    mode,
    similarities,
    differences,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Compare a single attribute across products
 */
function compareAttribute(
  products: Product[],
  attributeKey: string,
  mode: "strict" | "loose",
  dictionary: AttributeDictionary[]
): AttributeComparison | null {
  // Find dictionary entry for this attribute
  const dict = dictionary.find((d) => d.canonicalKey === attributeKey);
  
  // Collect values for this attribute from all products
  const values: Array<{
    productId: string;
    productName: string;
    value: AttributeValue;
  }> = [];
  
  products.forEach((product) => {
    const attrValue = product.attributes[attributeKey];
    if (attrValue) {
      values.push({
        productId: product.id,
        productName: product.name,
        value: attrValue,
      });
    }
  });
  
  if (values.length === 0) {
    return null;
  }
  
  // Normalize values based on mode
  const normalizedValues = values.map((v) => {
    if (mode === "strict") {
      return {
        ...v,
        normalizedValue: normalizeForStrictComparison(v.value, dict),
      };
    } else {
      return {
        ...v,
        normalizedValue: normalizeForLooseComparison(v.value, dict),
      };
    }
  });
  
  // Aggregate sources
  const sources: Source[] = [];
  normalizedValues.forEach((v) => {
    sources.push(v.value.source);
  });
  
  // Deduplicate sources by URL
  const uniqueSources = [
    ...new Map(sources.map((s) => [s.url, s])).values(),
  ];
  
  // Determine attribute group
  const attributeGroup = dict?.group || "other";
  
  return {
    attributeKey,
    attributeGroup,
    values,
    similarity: 0, // Will be calculated later
    sources: uniqueSources,
  };
}

/**
 * Normalize value for strict comparison
 */
function normalizeForStrictComparison(
  attrValue: AttributeValue,
  dict: AttributeDictionary | undefined
): string | number | boolean {
  // Strict: exact value match (with unit normalization if applicable)
  if (typeof attrValue.value === "number") {
    // Normalize units if dictionary specifies unit
    if (dict?.unit && attrValue.unit && attrValue.unit !== dict.unit) {
      // Convert to canonical unit (simplified - assumes conversion is available)
      // In practice, this would use the same conversion logic from normalizer
      return attrValue.value; // For now, return as-is (unit conversion handled in normalizer)
    }
    return attrValue.value;
  }
  
  if (typeof attrValue.value === "boolean") {
    return attrValue.value;
  }
  
  // String: exact match (case-insensitive, trimmed)
  if (typeof attrValue.value === "string") {
    return attrValue.value.toLowerCase().trim();
  }
  
  // Array: join and normalize
  if (Array.isArray(attrValue.value)) {
    return attrValue.value.map((v) => String(v).toLowerCase().trim()).join(",");
  }
  
  return String(attrValue.value).toLowerCase().trim();
}

/**
 * Normalize value for loose comparison
 */
function normalizeForLooseComparison(
  attrValue: AttributeValue,
  dict: AttributeDictionary | undefined
): string | number | boolean {
  // Loose: group-based comparison, normalize enums, ignore minor differences
  
  if (typeof attrValue.value === "number") {
    // For numbers, round to significant digits for loose comparison
    if (attrValue.value >= 1000) {
      return Math.round(attrValue.value / 100) * 100; // Round to nearest 100
    } else if (attrValue.value >= 100) {
      return Math.round(attrValue.value / 10) * 10; // Round to nearest 10
    } else {
      return Math.round(attrValue.value); // Round to nearest integer
    }
  }
  
  if (typeof attrValue.value === "boolean") {
    return attrValue.value;
  }
  
  // String: normalize for loose matching
  if (typeof attrValue.value === "string") {
    let normalized = attrValue.value.toLowerCase().trim();
    
    // Remove common prefixes/suffixes
    normalized = normalized.replace(/^(the|a|an)\s+/i, "");
    normalized = normalized.replace(/\s+(inc|llc|corp|co|ltd)\.?$/i, "");
    
    // Normalize enum values if dictionary specifies
    if (dict?.enumValues) {
      const match = dict.enumValues.find(
        (v) => v.toLowerCase() === normalized
      );
      if (match) {
        return match.toLowerCase();
      }
    }
    
    return normalized;
  }
  
  // Array: join and normalize
  if (Array.isArray(attrValue.value)) {
    return attrValue.value
      .map((v) => String(v).toLowerCase().trim())
      .sort()
      .join(",");
  }
  
  return String(attrValue.value).toLowerCase().trim();
}

/**
 * Calculate similarity score for an attribute comparison
 */
function calculateSimilarity(comparison: AttributeComparison): number {
  if (comparison.values.length < 2) {
    return 1.0; // Single value = 100% similar
  }
  
  // Get normalized values (for comparison)
  const normalized = comparison.values.map((v) => {
    // Simple normalization for comparison
    if (typeof v.value.value === "number") {
      return v.value.value;
    }
    if (typeof v.value.value === "boolean") {
      return v.value.value ? 1 : 0;
    }
    return String(v.value.value).toLowerCase().trim();
  });
  
  // Count unique values
  const uniqueValues = new Set(normalized);
  const uniqueCount = uniqueValues.size;
  const totalCount = normalized.length;
  
  // Similarity = 1 - (uniqueCount / totalCount)
  // If all values are the same, similarity = 1.0
  // If all values are different, similarity = 0.0
  return 1 - (uniqueCount - 1) / Math.max(totalCount - 1, 1);
}

/**
 * Find top N similarities
 */
export function findSimilarities(
  products: Product[],
  topN: number = 10,
  mode: "strict" | "loose" = "strict",
  dictionary: AttributeDictionary[] = DEFAULT_ATTRIBUTE_DICTIONARY
): AttributeComparison[] {
  const matrix = buildComparisonMatrix(products, mode, dictionary);
  return matrix.similarities.slice(0, topN);
}

/**
 * Find top N differences
 */
export function findDifferences(
  products: Product[],
  topN: number = 10,
  mode: "strict" | "loose" = "strict",
  dictionary: AttributeDictionary[] = DEFAULT_ATTRIBUTE_DICTIONARY
): AttributeComparison[] {
  const matrix = buildComparisonMatrix(products, mode, dictionary);
  return matrix.differences.slice(0, topN);
}

/**
 * Compare two products directly
 */
export function compareTwoProducts(
  product1: Product,
  product2: Product,
  mode: "strict" | "loose" = "strict",
  dictionary: AttributeDictionary[] = DEFAULT_ATTRIBUTE_DICTIONARY
): ComparisonMatrix {
  return buildComparisonMatrix([product1, product2], mode, dictionary);
}

/**
 * Get comparison summary (human-readable)
 */
export function getComparisonSummary(
  matrix: ComparisonMatrix
): {
  totalAttributes: number;
  similarAttributes: number;
  differentAttributes: number;
  topSimilarity: number;
  topDifference: number;
} {
  const total = matrix.similarities.length + matrix.differences.length;
  const similar = matrix.similarities.length;
  const different = matrix.differences.length;
  
  const topSimilarity =
    matrix.similarities.length > 0 ? matrix.similarities[0].similarity : 0;
  const topDifference =
    matrix.differences.length > 0
      ? matrix.differences[matrix.differences.length - 1].similarity
      : 1;
  
  return {
    totalAttributes: total,
    similarAttributes: similar,
    differentAttributes: different,
    topSimilarity,
    topDifference,
  };
}
