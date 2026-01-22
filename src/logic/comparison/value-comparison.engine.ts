/**
 * Value Comparison Engine
 * 
 * Compares products across value dimensions (non-price first).
 * 
 * Capabilities:
 * - Compare products across: Health impact, Experience, Longevity, Risk reduction
 * - Price comparison is optional and never default
 * - Output: "Why this is better for you" statements
 * - Optional numeric deltas
 * - Expandable proof only
 * 
 * CONTRACT-BOUNDARY: Do not change shape without updating SystemContract.ts
 */

import type { Product } from "../products/product-types";
import type { ValueDimensionId } from "../value/value-dimensions";
import type { ValueImpactBlock } from "../value/value-translation.engine";

export interface ProductComparison {
  productA: Product;
  productB: Product;
  dimension: ValueDimensionId;
  winner: "A" | "B" | "tie";
  statement: string; // "Why this is better for you"
  delta?: {
    value: number;
    unit: string;
    direction: "better" | "worse";
  };
  proof?: {
    facts: string[];
    assumptions: string[];
    researchFacts: string[];
  };
}

export interface ComparisonResult {
  comparisons: ProductComparison[];
  summary: string;
  dimensionsCompared: ValueDimensionId[];
}

/**
 * Compare two products across value dimensions
 * 
 * @param productA - First product
 * @param productB - Second product
 * @param dimensions - Value dimensions to compare (excludes "money" by default)
 * @param includePrice - Whether to include price comparison (default: false)
 * @returns Comparison result
 */
export function compareProducts(
  productA: Product,
  productB: Product,
  dimensions: ValueDimensionId[],
  includePrice: boolean = false
): ComparisonResult {
  const comparisons: ProductComparison[] = [];
  const dimensionsCompared: ValueDimensionId[] = [];

  // Filter out money dimension unless explicitly requested
  const comparisonDimensions = includePrice
    ? dimensions
    : dimensions.filter((d) => d !== "money");

  for (const dimension of comparisonDimensions) {
    const comparison = compareDimension(productA, productB, dimension);
    if (comparison) {
      comparisons.push(comparison);
      dimensionsCompared.push(dimension);
    }
  }

  const summary = generateComparisonSummary(comparisons);

  return {
    comparisons,
    summary,
    dimensionsCompared,
  };
}

/**
 * Compare two products on a specific dimension
 */
function compareDimension(
  productA: Product,
  productB: Product,
  dimension: ValueDimensionId
): ProductComparison | null {
  // Get value impact blocks for each product (would come from value translation)
  // For now, use product attributes to infer comparison

  switch (dimension) {
    case "health":
      return compareHealth(productA, productB);
    case "experience":
      return compareExperience(productA, productB);
    case "quality":
      return compareQuality(productA, productB);
    case "risk":
      return compareRisk(productA, productB);
    case "longevity":
      return compareLongevity(productA, productB);
    default:
      return null; // Skip dimensions that don't support comparison
  }
}

/**
 * Compare health impact
 */
function compareHealth(productA: Product, productB: Product): ProductComparison | null {
  // Check for pH balance, irritant-free claims, etc.
  const aPh = extractPhValue(productA);
  const bPh = extractPhValue(productB);

  if (aPh && bPh) {
    // pH closer to 6.0 (skin's natural pH) is better
    const aDistance = Math.abs(aPh - 6.0);
    const bDistance = Math.abs(bPh - 6.0);

    if (aDistance < bDistance) {
      return {
        productA,
        productB,
        dimension: "health",
        winner: "A",
        statement: `${productA.name} has a pH closer to skin's natural balance (${aPh} vs ${bPh}), reducing barrier disruption risk`,
        delta: {
          value: bDistance - aDistance,
          unit: "pH units",
          direction: "better",
        },
        proof: {
          facts: [`pH_${aPh}`, `pH_${bPh}`],
          assumptions: ["skin_barrier_impact"],
          researchFacts: ["health_002"], // pH balance research
        },
      };
    } else if (bDistance < aDistance) {
      return {
        productA,
        productB,
        dimension: "health",
        winner: "B",
        statement: `${productB.name} has a pH closer to skin's natural balance (${bPh} vs ${aPh}), reducing barrier disruption risk`,
        delta: {
          value: aDistance - bDistance,
          unit: "pH units",
          direction: "better",
        },
        proof: {
          facts: [`pH_${aPh}`, `pH_${bPh}`],
          assumptions: ["skin_barrier_impact"],
          researchFacts: ["health_002"],
        },
      };
    }
  }

  return null;
}

/**
 * Compare experience
 */
function compareExperience(productA: Product, productB: Product): ProductComparison | null {
  // Compare based on user experience attributes
  // For instruments: sound quality, playability
  // For skincare: texture, absorption

  // Placeholder: Would use product attributes
  return null;
}

/**
 * Compare quality/longevity
 */
function compareQuality(productA: Product, productB: Product): ProductComparison | null {
  // Compare based on materials, construction quality
  // For instruments: solid wood vs laminate, hardware quality

  const aMaterials = extractMaterials(productA);
  const bMaterials = extractMaterials(productB);

  if (aMaterials.includes("solid wood") && !bMaterials.includes("solid wood")) {
    return {
      productA,
      productB,
      dimension: "quality",
      winner: "A",
      statement: `${productA.name} uses solid wood construction, improving resonance stability over time compared to ${productB.name}`,
      proof: {
        facts: ["materials_solid_wood"],
        assumptions: ["wood_aging_resonance"],
        researchFacts: ["materials_001"], // Solid wood research
      },
    };
  }

  if (bMaterials.includes("solid wood") && !aMaterials.includes("solid wood")) {
    return {
      productA,
      productB,
      dimension: "quality",
      winner: "B",
      statement: `${productB.name} uses solid wood construction, improving resonance stability over time compared to ${productA.name}`,
      proof: {
        facts: ["materials_solid_wood"],
        assumptions: ["wood_aging_resonance"],
        researchFacts: ["materials_001"],
      },
    };
  }

  return null;
}

/**
 * Compare risk
 */
function compareRisk(productA: Product, productB: Product): ProductComparison | null {
  // Compare based on safety attributes, irritant-free claims, etc.
  return null;
}

/**
 * Compare longevity
 */
function compareLongevity(productA: Product, productB: Product): ProductComparison | null {
  // Compare based on expected lifespan, maintenance requirements
  const aLifespan = extractLifespan(productA);
  const bLifespan = extractLifespan(productB);

  if (aLifespan && bLifespan) {
    if (aLifespan > bLifespan) {
      return {
        productA,
        productB,
        dimension: "longevity",
        winner: "A",
        statement: `${productA.name} has a longer expected lifespan (${aLifespan} years vs ${bLifespan} years)`,
        delta: {
          value: aLifespan - bLifespan,
          unit: "years",
          direction: "better",
        },
        proof: {
          facts: [`lifespan_${aLifespan}`, `lifespan_${bLifespan}`],
          assumptions: ["instrument_lifespan"],
          researchFacts: ["materials_002"], // Hardware durability
        },
      };
    } else if (bLifespan > aLifespan) {
      return {
        productA,
        productB,
        dimension: "longevity",
        winner: "B",
        statement: `${productB.name} has a longer expected lifespan (${bLifespan} years vs ${aLifespan} years)`,
        delta: {
          value: bLifespan - aLifespan,
          unit: "years",
          direction: "better",
        },
        proof: {
          facts: [`lifespan_${aLifespan}`, `lifespan_${bLifespan}`],
          assumptions: ["instrument_lifespan"],
          researchFacts: ["materials_002"],
        },
      };
    }
  }

  return null;
}

/**
 * Generate comparison summary
 */
function generateComparisonSummary(comparisons: ProductComparison[]): string {
  if (comparisons.length === 0) {
    return "No significant differences found between products.";
  }

  const winners = {
    A: comparisons.filter((c) => c.winner === "A").length,
    B: comparisons.filter((c) => c.winner === "B").length,
    tie: comparisons.filter((c) => c.winner === "tie").length,
  };

  if (winners.A > winners.B) {
    return `Product A leads in ${winners.A} dimension(s), Product B leads in ${winners.B} dimension(s).`;
  } else if (winners.B > winners.A) {
    return `Product B leads in ${winners.B} dimension(s), Product A leads in ${winners.A} dimension(s).`;
  } else {
    return `Products are comparable across ${comparisons.length} dimension(s).`;
  }
}

/**
 * Extract pH value from product
 */
function extractPhValue(product: Product): number | null {
  // Check attributes for pH value
  const phAttr = product.attributes["ph"] || product.attributes["pH"];
  if (phAttr && typeof phAttr.value === "number") {
    return phAttr.value;
  }
  return null;
}

/**
 * Extract materials from product
 */
function extractMaterials(product: Product): string[] {
  const materials: string[] = [];
  const materialAttr = product.attributes["materials"] || product.attributes["construction"];
  if (materialAttr) {
    if (Array.isArray(materialAttr.value)) {
      materials.push(...materialAttr.value);
    } else if (typeof materialAttr.value === "string") {
      materials.push(materialAttr.value);
    }
  }
  return materials;
}

/**
 * Extract lifespan from product
 */
function extractLifespan(product: Product): number | null {
  const lifespanAttr = product.attributes["lifespan"] || product.attributes["expected_lifespan"];
  if (lifespanAttr && typeof lifespanAttr.value === "number") {
    return lifespanAttr.value;
  }
  return null;
}
