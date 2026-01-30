// src/logic/calcs/types.ts
// Calculation types - pure function contracts

/**
 * Calculation input - state values passed to calculation function
 */
export type CalcInput = Record<string, any>;

/**
 * Calculation result - output from calculation function
 */
export type CalcResult = {
  value: number | string | boolean | object | null;
  metadata?: {
    unit?: string;
    label?: string;
    [key: string]: any;
  };
};

/**
 * Calculation function signature
 * Pure function: inputs → result (no side effects)
 */
export type CalcFunction = (inputs: CalcInput) => CalcResult | Promise<CalcResult>;

/**
 * Calculation definition
 */
export type CalcDefinition = {
  id: string;
  name: string;
  description?: string;
  inputs: string[]; // Expected input keys
  fn: CalcFunction;
};

/**
 * Calculation reference in Flow JSON (data only, no code)
 */
export type CalcRef = {
  id: string; // Registry key
  inputs?: string[]; // State keys to pass as inputs
  output?: string; // State key to store result
};
