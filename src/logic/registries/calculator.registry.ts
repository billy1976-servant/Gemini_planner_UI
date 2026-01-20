import simpleHours from "@/logic/calculator-types/simple-hours.json";
import profit from "@/logic/calculator-types/profit.calculator.json";


/**
 * LOCKED REGISTRY
 * Canon lookup table for all calculator definitions.
 * JSON is canon. Registry only wires IDs → JSON.
 */
const CALCULATOR_REGISTRY: Record<string, any> = {
  "cleanup_labor_monthly": simpleHours,
  "cleanup-labor": simpleHours,
  "profit": profit,
  "monthly-loss": profit,
  "morale": profit,
};


export function getCalculator(calculatorId: string) {
  const calc = CALCULATOR_REGISTRY[calculatorId];
  if (!calc) {
    throw new Error(`Calculator not registered: ${calculatorId}`);
  }
  return calc;
}


export function listCalculators() {
  return Object.keys(CALCULATOR_REGISTRY);
}


export function hasCalculator(calculatorId: string): boolean {
  return calculatorId in CALCULATOR_REGISTRY;
}


export type CalculatorId = keyof typeof CALCULATOR_REGISTRY;


