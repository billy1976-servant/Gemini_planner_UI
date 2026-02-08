/**
 * Engine contract facade — single public API for engine/action execution.
 * Re-exports action-registry (trunk) and engine-registry (flow).
 * Prefer importing from this module instead of action-registry or engine-registry directly.
 */
export { getActionHandler } from "@/logic/runtime/action-registry";
export {
  getExecutionEngine,
  getAftermathProcessor,
  getEngine,
  applyEngine,
  getAvailableEngines,
  getAvailableAftermathProcessors,
  isExecutionEngine,
  isAftermathProcessor,
  getPresentation,
  ENGINE_REGISTRY,
  EXECUTION_ENGINE_REGISTRY,
  AFTERMATH_PROCESSOR_REGISTRY,
  PRESENTATION_REGISTRY,
  type EngineId,
  type ExecutionEngineId,
  type AftermathProcessorId,
  type EngineFunction,
  type PresentationFunction,
} from "./engine-registry";
