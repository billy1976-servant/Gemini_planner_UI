/**
 * Single calculator registration surface.
 * All calculator/calc registration and execution: use this module only.
 * Implementation lives in logic/engines/calculator/calcs/calc-registry (canon).
 */
export {
  getCalculator,
  listCalculators,
  hasCalculator,
  registerCalc,
  getCalc,
  executeCalc,
  listCalcs,
} from "@/logic/engines/calculator/calcs/calc-registry";
