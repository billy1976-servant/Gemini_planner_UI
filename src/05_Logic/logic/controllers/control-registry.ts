/**
 * Control Registry
 * 
 * PURPOSE:
 * - Register controllers alongside existing engines
 * - Follow same pattern as engine-registry
 * - No breaking changes
 * 
 * CONTRACT-BOUNDARY: Do not change shape without updating SystemContract.ts
 */

import { computeAdControlState, type AdControlState, type ControlDecisionInput } from "./google-ads.controller";
import type { ScanEvent } from "@/scans/global-scans/types";

export type ControllerId = "google-ads";

export type ControllerFunction = (input: ControlDecisionInput) => AdControlState;

/**
 * CONTROL REGISTRY
 * Maps controller IDs to their control functions
 */
export const CONTROL_REGISTRY: Record<ControllerId, ControllerFunction> = {
  "google-ads": computeAdControlState,
};

/**
 * Get a controller by ID
 * @throws Error if controller ID is not found
 */
export function getController(controllerId: ControllerId): ControllerFunction {
  const controller = CONTROL_REGISTRY[controllerId];
  if (!controller) {
    throw new Error(`Controller not found: ${controllerId}. Available controllers: ${Object.keys(CONTROL_REGISTRY).join(", ")}`);
  }
  return controller;
}

/**
 * Get all available controller IDs
 */
export function getAvailableControllers(): ControllerId[] {
  return Object.keys(CONTROL_REGISTRY) as ControllerId[];
}

/**
 * Check if a controller ID exists
 */
export function hasController(controllerId: string): controllerId is ControllerId {
  return controllerId in CONTROL_REGISTRY;
}

/**
 * Apply a controller to scan events
 * 
 * @param controllerId - The controller to use
 * @param input - Control decision input (scan events + current state)
 * @returns AdControlState with recommended changes
 */
export function applyController(
  controllerId: ControllerId,
  input: ControlDecisionInput
): AdControlState {
  const controller = getController(controllerId);
  return controller(input);
}
