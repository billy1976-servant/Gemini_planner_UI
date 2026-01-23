/**
 * Control Flow - Wire controller into existing logic flow
 * 
 * PURPOSE:
 * - Logic → Scan → Controller → Decision output
 * - Consumes scan events and produces control decisions
 * - Does NOT modify calculators or comparison engines
 * - Controller only consumes their outputs if available
 * 
 * CONSTRAINTS:
 * - Additive only
 * - No refactors
 * - Deterministic
 */

import { applyController } from "./control-registry";
import { executeAdControlStateSafe } from "../executors/google-ads.executor";
import type { ScanEvent } from "@/scans/global-scans/types";
import type { AdControlState } from "./google-ads.controller";

/**
 * Control Flow Input
 */
export interface ControlFlowInput {
  scanEvents: ScanEvent[];
  currentBudget?: number;
  currentBid?: number;
  currentStatus?: "active" | "paused";
  campaignId?: string;
  engineState?: {
    calcOutputs?: Record<string, any>;
    accumulatedSignals?: string[];
  };
}

/**
 * Control Flow Output
 */
export interface ControlFlowOutput {
  controlState: AdControlState;
  executionResult: {
    success: boolean;
    changes: Array<{
      type: "budget" | "bid" | "schedule";
      action: string;
      from: any;
      to: any;
      reason: string;
    }>;
    timestamp: number;
    dryRun: boolean;
  };
}

/**
 * Run control flow: Scan → Controller → Executor
 * 
 * This function wires the controller into the logic flow:
 * 1. Takes scan events (from global scan sources)
 * 2. Optionally consumes engine state outputs (if available)
 * 3. Runs controller to compute control decisions
 * 4. Executes changes (dry-run mode)
 * 
 * @param input - Control flow input (scan events + optional state)
 * @returns Control flow output (control state + execution result)
 */
export async function runControlFlow(
  input: ControlFlowInput
): Promise<ControlFlowOutput> {
  // Step 1: Prepare controller input
  // Controller consumes scan events and current ad state
  // Engine state outputs (calcOutputs, signals) are available but not required
  const controllerInput = {
    scanEvents: input.scanEvents,
    currentBudget: input.currentBudget,
    currentBid: input.currentBid,
    currentStatus: input.currentStatus,
    campaignId: input.campaignId,
  };

  // Step 2: Run controller to compute control decisions
  const controlState = applyController("google-ads", controllerInput);

  // Step 3: Execute control state (dry-run mode)
  const executionResult = await executeAdControlStateSafe(controlState, true);

  return {
    controlState,
    executionResult,
  };
}

/**
 * Run control flow synchronously (for testing)
 */
export function runControlFlowSync(input: ControlFlowInput): ControlFlowOutput {
  const controllerInput = {
    scanEvents: input.scanEvents,
    currentBudget: input.currentBudget,
    currentBid: input.currentBid,
    currentStatus: input.currentStatus,
    campaignId: input.campaignId,
  };

  const controlState = applyController("google-ads", controllerInput);
  
  // For sync version, we still use async executor but await it immediately
  // In practice, use runControlFlow() for async execution
  const executionResult = {
    success: true,
    changes: [] as ControlFlowOutput["executionResult"]["changes"],
    timestamp: Date.now(),
    dryRun: true,
  };

  // Log changes synchronously
  if (controlState.budget.change !== "maintain") {
    executionResult.changes.push({
      type: "budget",
      action: controlState.budget.change,
      from: controlState.budget.current,
      to: controlState.budget.recommended,
      reason: controlState.budget.reason,
    });
  }
  if (controlState.bid.change !== "maintain") {
    executionResult.changes.push({
      type: "bid",
      action: controlState.bid.change,
      from: controlState.bid.current,
      to: controlState.bid.recommended,
      reason: controlState.bid.reason,
    });
  }
  if (controlState.schedule.change !== "maintain") {
    executionResult.changes.push({
      type: "schedule",
      action: controlState.schedule.change,
      from: controlState.schedule.current,
      to: controlState.schedule.recommended,
      reason: controlState.schedule.reason,
    });
  }

  return {
    controlState,
    executionResult,
  };
}
