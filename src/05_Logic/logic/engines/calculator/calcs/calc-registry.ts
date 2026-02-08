// src/logic/engines/calculator/calcs/calc-registry.ts
// Single calculator/calc registration: JSON definitions + calculation functions
// Calculator type definitions: single bundle logic/engines/calculator/calculator-types.json

import type { CalcDefinition, CalcInput, CalcResult } from "./types";
import calculatorTypes from "../calculator-types.json";

const simpleHours = calculatorTypes.simpleHours;
const profit = calculatorTypes.profit;

/** Calculator JSON definitions (id → config). Canon lookup for run-calculator and calculator.module. */
const CALCULATOR_REGISTRY: Record<string, unknown> = {
  cleanup_labor_monthly: simpleHours,
  "cleanup-labor": simpleHours,
  profit,
  "monthly-loss": profit,
  morale: profit,
};

export function getCalculator(calculatorId: string): unknown {
  const calc = CALCULATOR_REGISTRY[calculatorId];
  if (!calc) throw new Error(`Calculator not registered: ${calculatorId}`);
  return calc;
}

export function listCalculators(): string[] {
  return Object.keys(CALCULATOR_REGISTRY);
}

export function hasCalculator(calculatorId: string): boolean {
  return calculatorId in CALCULATOR_REGISTRY;
}

/**
 * Registry of calculation functions (registerCalc, getCalc, executeCalc)
 */
const CALC_REGISTRY: Map<string, CalcDefinition> = new Map();

/**
 * Register a calculation function
 */
export function registerCalc(definition: CalcDefinition): void {
  CALC_REGISTRY.set(definition.id, definition);
}

/**
 * Get a calculation function by ID
 */
export function getCalc(id: string): CalcDefinition | null {
  return CALC_REGISTRY.get(id) || null;
}

/**
 * Execute a calculation by ID
 */
export async function executeCalc(
  id: string,
  inputs: CalcInput
): Promise<CalcResult> {
  const calc = getCalc(id);
  if (!calc) {
    throw new Error(`Calculation not found: ${id}`);
  }

  // Validate inputs
  const missingInputs = calc.inputs.filter((key) => !(key in inputs));
  if (missingInputs.length > 0) {
    throw new Error(`Missing required inputs for ${id}: ${missingInputs.join(", ")}`);
  }

  // Execute calculation function
  const result = await calc.fn(inputs);
  return result;
}

/**
 * Initialize default calculations
 */
function initializeDefaultCalcs(): void {
  // 25x Monthly Loss Calculation
  registerCalc({
    id: "cleanup_monthly_cost",
    name: "Cleanup Monthly Cost",
    description: "Calculates monthly profit loss from cleanup time",
    inputs: ["crewSize", "minutesPerDay", "wage"],
    fn: (inputs: CalcInput): CalcResult => {
      const crewSize = Number(inputs.crewSize) || 0;
      const minutesPerDay = Number(inputs.minutesPerDay) || 0;
      const wage = Number(inputs.wage) || 0;

      // Calculate daily cost
      const hoursPerDay = minutesPerDay / 60;
      const dailyCost = crewSize * hoursPerDay * wage;

      // Calculate monthly cost (assuming 20 working days)
      const monthlyCost = dailyCost * 20;

      // Calculate annual cost
      const annualCost = monthlyCost * 12;

      return {
        value: monthlyCost,
        metadata: {
          unit: "dollars",
          label: "Monthly Loss",
          dailyCost,
          annualCost,
          crewSize,
          minutesPerDay,
          wage,
        },
      };
    },
  });

  // Intent Score Calculation
  registerCalc({
    id: "intent_score",
    name: "Intent Score",
    description: "Calculates intent score based on monthly loss",
    inputs: ["monthlyLoss"],
    fn: (inputs: CalcInput): CalcResult => {
      const monthlyLoss = Number(inputs.monthlyLoss) || 0;

      // Score based on loss amount
      let score = 0;
      if (monthlyLoss >= 5000) {
        score = 90;
      } else if (monthlyLoss >= 2000) {
        score = 70;
      } else if (monthlyLoss >= 1000) {
        score = 50;
      } else if (monthlyLoss >= 500) {
        score = 30;
      } else {
        score = 10;
      }

      return {
        value: score,
        metadata: {
          unit: "score",
          label: "Intent Score",
          monthlyLoss,
        },
      };
    },
  });

  // Total Loss Calculation (25x rule)
  registerCalc({
    id: "total_loss_25x",
    name: "Total Loss (25x Rule)",
    description: "Calculates total loss using 25x multiplier",
    inputs: ["monthlyLoss"],
    fn: (inputs: CalcInput): CalcResult => {
      const monthlyLoss = Number(inputs.monthlyLoss) || 0;
      const totalLoss = monthlyLoss * 25;

      return {
        value: totalLoss,
        metadata: {
          unit: "dollars",
          label: "Total Loss (25x)",
          monthlyLoss,
          multiplier: 25,
        },
      };
    },
  });

  // Product Cost Calculator
  registerCalc({
    id: "product-cost",
    name: "Product Cost Calculator",
    description: "Calculates product costs, savings, and ROI based on selected products and usage",
    inputs: ["selectedProductIds", "products", "yearsOwned", "usageFrequency", "budgetRange", "scenarioType"],
    fn: async (inputs: CalcInput): Promise<CalcResult> => {
      const { calculateProductCosts } = await import("./product-calculator");
      const result = calculateProductCosts(inputs as any);
      
      return {
        value: result.totalCost,
        metadata: {
          unit: "dollars",
          label: "Product Total Cost",
          ...result,
        },
      };
    },
  });
}

// Initialize on module load
initializeDefaultCalcs();

/**
 * List all registered calculations
 */
export function listCalcs(): string[] {
  return Array.from(CALC_REGISTRY.keys());
}
