/**
 * Product Calculator - Calculate product costs, savings, and ROI
 * 
 * Deterministic calculations based on:
 * - Selected products
 * - User inputs (yearsOwned, usageFrequency, budgetRange, scenarioType)
 * - Product prices and attributes
 * 
 * Outputs:
 * - totalCost: Total cost over ownership period
 * - monthlySavings: Monthly savings vs baseline
 * - roi: Return on investment percentage
 * - assumptions: Input assumptions with sources
 */

import type { Product } from "@/logic/products/product-types";
import type { CalcInput, CalcResult } from "./types";

export type ProductCalculatorInput = CalcInput & {
  selectedProductIds: string[];
  products: Product[]; // Full product objects
  yearsOwned: number;
  usageFrequency: number; // Times per month
  budgetRange: string; // "low" | "medium" | "high"
  scenarioType: string; // "conservative" | "moderate" | "aggressive"
};

export type ProductCalculatorResult = {
  totalCost: number;
  monthlySavings: number;
  roi: number;
  assumptions: {
    yearsOwned: number;
    usageFrequency: number;
    budgetRange: string;
    scenarioType: string;
    sources: Array<{ label: string; url: string; snippet: string }>;
  };
  breakdown: {
    initialCost: number;
    monthlyCost: number;
    annualCost: number;
    totalCost: number;
    baselineCost: number; // Cost without product
    savings: number;
  };
  selectedProducts: Array<{
    id: string;
    name: string;
    price: number;
    contribution: number; // Contribution to total cost
  }>;
};

/**
 * Calculate product costs and savings
 */
export function calculateProductCosts(
  inputs: ProductCalculatorInput
): ProductCalculatorResult {
  const {
    selectedProductIds,
    products,
    yearsOwned,
    usageFrequency,
    budgetRange,
    scenarioType,
  } = inputs;

  // Filter to selected products
  const selectedProducts = products.filter((p) =>
    selectedProductIds.includes(p.id)
  );

  if (selectedProducts.length === 0) {
    return {
      totalCost: 0,
      monthlySavings: 0,
      roi: 0,
      assumptions: {
        yearsOwned,
        usageFrequency,
        budgetRange,
        scenarioType,
        sources: [],
      },
      breakdown: {
        initialCost: 0,
        monthlyCost: 0,
        annualCost: 0,
        totalCost: 0,
        baselineCost: 0,
        savings: 0,
      },
      selectedProducts: [],
    };
  }

  // Calculate initial cost (sum of product prices)
  const initialCost = selectedProducts.reduce(
    (sum, p) => sum + p.price.amount,
    0
  );

  // Calculate monthly cost based on usage frequency and scenario
  const scenarioMultiplier = getScenarioMultiplier(scenarioType);
  const monthlyCost = calculateMonthlyCost(
    selectedProducts,
    usageFrequency,
    scenarioMultiplier
  );

  // Calculate annual cost
  const annualCost = monthlyCost * 12;

  // Calculate total cost over ownership period
  const totalCost = initialCost + annualCost * yearsOwned;

  // Calculate baseline cost (without products)
  const baselineCost = calculateBaselineCost(
    usageFrequency,
    budgetRange,
    yearsOwned
  );

  // Calculate savings
  const savings = baselineCost - totalCost;
  const monthlySavings = savings / (yearsOwned * 12);

  // Calculate ROI
  const roi = initialCost > 0 ? (savings / initialCost) * 100 : 0;

  // Build assumptions with sources
  const assumptions = {
    yearsOwned,
    usageFrequency,
    budgetRange,
    scenarioType,
    sources: buildAssumptionSources(selectedProducts, inputs),
  };

  // Calculate product contributions
  const selectedProductsWithContribution = selectedProducts.map((product) => ({
    id: product.id,
    name: product.name,
    price: product.price.amount,
    contribution: product.price.amount / initialCost,
  }));

  return {
    totalCost,
    monthlySavings,
    roi,
    assumptions,
    breakdown: {
      initialCost,
      monthlyCost,
      annualCost,
      totalCost,
      baselineCost,
      savings,
    },
    selectedProducts: selectedProductsWithContribution,
  };
}

/**
 * Get scenario multiplier for cost calculations
 */
function getScenarioMultiplier(scenarioType: string): number {
  switch (scenarioType) {
    case "conservative":
      return 0.8; // 20% lower costs
    case "moderate":
      return 1.0; // Baseline
    case "aggressive":
      return 1.2; // 20% higher costs
    default:
      return 1.0;
  }
}

/**
 * Calculate monthly cost based on products and usage
 */
function calculateMonthlyCost(
  products: Product[],
  usageFrequency: number,
  scenarioMultiplier: number
): number {
  // Simple calculation: average product price * usage frequency * multiplier
  const avgPrice = products.reduce((sum, p) => sum + p.price.amount, 0) / products.length;
  return avgPrice * (usageFrequency / 30) * scenarioMultiplier;
}

/**
 * Calculate baseline cost without products
 */
function calculateBaselineCost(
  usageFrequency: number,
  budgetRange: string,
  yearsOwned: number
): number {
  // Baseline cost multipliers by budget range
  const budgetMultipliers: Record<string, number> = {
    low: 0.7,
    medium: 1.0,
    high: 1.5,
  };

  const multiplier = budgetMultipliers[budgetRange] || 1.0;
  const monthlyBaseline = 100 * usageFrequency * multiplier; // $100 base per usage
  const annualBaseline = monthlyBaseline * 12;
  return annualBaseline * yearsOwned;
}

/**
 * Build assumption sources from products and inputs
 */
function buildAssumptionSources(
  products: Product[],
  inputs: ProductCalculatorInput
): Array<{ label: string; url: string; snippet: string }> {
  const sources: Array<{ label: string; url: string; snippet: string }> = [];

  // Add product price sources
  products.forEach((product) => {
    sources.push({
      label: `Price: ${product.name}`,
      url: product.price.source.url,
      snippet: product.price.source.snippet,
    });
  });

  // Add assumption sources (from user inputs)
  // These would come from the UI/config, but for now we'll create generic ones
  sources.push({
    label: "Ownership Period Assumption",
    url: "#",
    snippet: `Assumed ${inputs.yearsOwned} years of ownership`,
  });

  sources.push({
    label: "Usage Frequency Assumption",
    url: "#",
    snippet: `Assumed ${inputs.usageFrequency} uses per month`,
  });

  return sources;
}
