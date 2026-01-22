/**
 * Engine Registry - Central registry for all presentation engines
 * 
 * ENGINE ROLE CLASSIFICATION:
 * ===========================
 * 
 * EXECUTION ENGINES (step-executing):
 * - These engines execute steps and route through the flow
 * - They transform flow presentation and determine step progression
 * - Used in step routing loops and UI rendering
 * - Examples: learning, calculator, abc
 * 
 * AFTERMATH PROCESSORS (post-engine):
 * - These engines consume completed EngineState and generate outputs
 * - They do NOT execute steps or participate in routing
 * - They are downstream processors that analyze accumulated results
 * - Examples: decision, summary
 * 
 * IMPORTANT: Aftermath processors are excluded from:
 * - Step routing loops
 * - Engine selector UI (execution flow)
 * - Step progression logic
 */

import { learningEngine, learningPresentation } from "./learning.engine";
import { calculatorEngine, calculatorPresentation } from "./calculator.engine";
import { abcEngine, abcPresentation } from "./abc.engine";
import { decisionEngine, decisionPresentation } from "./decision.engine";
import { summaryEngine, summaryPresentation } from "./summary.engine";
import type { EducationFlow } from "@/logic/content/flow-loader";
import type { EngineFlow } from "./learning.engine";
import type { PresentationModel } from "./presentation-types";

export type EngineId = "learning" | "calculator" | "abc" | "decision" | "summary";

// Execution engines: participate in step routing and flow execution
export type ExecutionEngineId = "learning" | "calculator" | "abc";

// Aftermath processors: consume EngineState, generate outputs, do NOT route steps
export type AftermathProcessorId = "decision" | "summary";

export type EngineFunction = (flow: EducationFlow) => EngineFlow;
export type PresentationFunction = (flow: EducationFlow) => PresentationModel;

/**
 * EXECUTION ENGINES REGISTRY
 * These engines execute steps and participate in routing loops
 */
export const EXECUTION_ENGINE_REGISTRY: Record<ExecutionEngineId, EngineFunction> = {
  learning: learningEngine,
  calculator: calculatorEngine,
  abc: abcEngine,
};

/**
 * AFTERMATH PROCESSORS REGISTRY
 * These processors consume EngineState and generate outputs
 * They do NOT execute steps or participate in routing
 * 
 * NOTE: The functions here are legacy wrappers for backward compatibility.
 * Use processDecisionState() and processSummaryState() directly instead.
 */
export const AFTERMATH_PROCESSOR_REGISTRY: Record<AftermathProcessorId, EngineFunction> = {
  decision: decisionEngine,
  summary: summaryEngine,
};

/**
 * LEGACY REGISTRY (for backward compatibility)
 * Contains all engines, but execution engines should be preferred for step routing
 * @deprecated Use EXECUTION_ENGINE_REGISTRY for step routing, AFTERMATH_PROCESSOR_REGISTRY for post-processing
 */
export const ENGINE_REGISTRY: Record<EngineId, EngineFunction> = {
  ...EXECUTION_ENGINE_REGISTRY,
  ...AFTERMATH_PROCESSOR_REGISTRY,
};

/**
 * PRESENTATION REGISTRY
 * Maps all engines (execution + aftermath) to their presentation models
 */
export const PRESENTATION_REGISTRY: Record<EngineId, PresentationFunction> = {
  learning: learningPresentation,
  calculator: calculatorPresentation,
  abc: abcPresentation,
  decision: decisionPresentation,
  summary: summaryPresentation,
};

/**
 * Get an execution engine by ID
 * Only returns engines that can execute steps
 * @throws Error if engine ID is not found or is an aftermath processor
 */
export function getExecutionEngine(engineId: ExecutionEngineId): EngineFunction {
  const engine = EXECUTION_ENGINE_REGISTRY[engineId];
  if (!engine) {
    throw new Error(`Execution engine not found: ${engineId}. Available execution engines: ${Object.keys(EXECUTION_ENGINE_REGISTRY).join(", ")}`);
  }
  return engine;
}

/**
 * Get an aftermath processor by ID
 * Returns processors that consume EngineState and generate outputs
 * @throws Error if processor ID is not found or is an execution engine
 */
export function getAftermathProcessor(processorId: AftermathProcessorId): EngineFunction {
  const processor = AFTERMATH_PROCESSOR_REGISTRY[processorId];
  if (!processor) {
    throw new Error(`Aftermath processor not found: ${processorId}. Available processors: ${Object.keys(AFTERMATH_PROCESSOR_REGISTRY).join(", ")}`);
  }
  return processor;
}

/**
 * Get an engine by ID (legacy - supports both execution and aftermath)
 * @throws Error if engine ID is not found
 * @deprecated Prefer getExecutionEngine() or getAftermathProcessor() for clarity
 */
export function getEngine(engineId: EngineId): EngineFunction {
  const engine = ENGINE_REGISTRY[engineId];
  if (!engine) {
    throw new Error(`Engine not found: ${engineId}. Available engines: ${Object.keys(ENGINE_REGISTRY).join(", ")}`);
  }
  return engine;
}

/**
 * Check if an engine ID is an execution engine
 */
export function isExecutionEngine(engineId: EngineId): engineId is ExecutionEngineId {
  return engineId in EXECUTION_ENGINE_REGISTRY;
}

/**
 * Check if an engine ID is an aftermath processor
 */
export function isAftermathProcessor(engineId: EngineId): engineId is AftermathProcessorId {
  return engineId in AFTERMATH_PROCESSOR_REGISTRY;
}

/**
 * Apply an execution engine transformation to a flow
 * Only accepts execution engines (not aftermath processors)
 * Falls back to learning engine if transformation fails
 */
export function applyEngine(flow: EducationFlow, engineId: EngineId): EngineFlow {
  // Guard: Only execution engines can be applied for step routing
  if (isAftermathProcessor(engineId)) {
    console.warn(`[EngineRegistry] Attempted to apply aftermath processor "${engineId}" as execution engine. Aftermath processors do not execute steps. Falling back to learning.`);
    return EXECUTION_ENGINE_REGISTRY.learning(flow);
  }
  
  try {
    const engine = getExecutionEngine(engineId as ExecutionEngineId);
    return engine(flow);
  } catch (error) {
    console.error(`[EngineRegistry] Execution engine ${engineId} failed, falling back to learning:`, error);
    // Fallback to learning engine
    return EXECUTION_ENGINE_REGISTRY.learning(flow);
  }
}

/**
 * Get all available execution engine IDs
 * Returns only engines that can execute steps (excludes aftermath processors)
 * Use this for engine selector UI and step routing loops
 */
export function getAvailableEngines(): ExecutionEngineId[] {
  return Object.keys(EXECUTION_ENGINE_REGISTRY) as ExecutionEngineId[];
}

/**
 * Get all available aftermath processor IDs
 * Returns processors that consume EngineState and generate outputs
 * Use this for post-processing and output generation
 */
export function getAvailableAftermathProcessors(): AftermathProcessorId[] {
  return Object.keys(AFTERMATH_PROCESSOR_REGISTRY) as AftermathProcessorId[];
}

/**
 * Get presentation model for a flow using the specified engine
 */
export function getPresentation(flow: EducationFlow, engineId: EngineId): PresentationModel {
  const presentationFn = PRESENTATION_REGISTRY[engineId];
  if (!presentationFn) {
    // Fallback to learning if engine not found
    return PRESENTATION_REGISTRY.learning(flow);
  }
  return presentationFn(flow);
}
