// src/logic/runtime/calc-resolver.ts
// Resolves and executes calcRefs from Flow JSON
// Legacy/unused on main JSON screen path. No callers of resolveCalcs in codebase; for future calculator/flow integration.

import type { CalcRef } from "../engines/calculator/calcs/types";
import { executeCalc } from "../engines/calculator/calcs/calc-registry";
import { readEngineState, writeEngineState } from "./engine-bridge";

/**
 * Resolve and execute calcRefs from a flow
 * Reads calcRefs from flow JSON, executes via registry, stores results in engine state
 */
export async function resolveCalcs(
  calcRefs: CalcRef[],
  state?: Record<string, any>
): Promise<Record<string, any>> {
  const currentState = state || readEngineState() || {};
  const results: Record<string, any> = {};

  for (const calcRef of calcRefs) {
    try {
      // Extract inputs from state
      const inputs: Record<string, any> = {};
      if (calcRef.inputs) {
        for (const key of calcRef.inputs) {
          inputs[key] = currentState[key];
        }
      }

      // Execute calculation
      const calcResult = await executeCalc(calcRef.id, inputs);

      // Store result in state
      if (calcRef.output) {
        results[calcRef.output] = calcResult.value;
        // Also store full result with metadata
        results[`${calcRef.output}_metadata`] = calcResult.metadata;
      } else {
        // Default: store as calcRef.id
        results[calcRef.id] = calcResult.value;
        results[`${calcRef.id}_metadata`] = calcResult.metadata;
      }
    } catch (error: any) {
      console.error(`[calc-resolver] Failed to execute calc ${calcRef.id}:`, error);
      // Continue with other calcs even if one fails
    }
  }

  // Update engine state with results
  if (Object.keys(results).length > 0) {
    writeEngineState(results);
  }

  return results;
}

/**
 * Check if a flow has calcRefs
 */
export function hasCalcs(flow: any): boolean {
  return Array.isArray(flow.calcRefs) && flow.calcRefs.length > 0;
}
