/**
 * Pipeline diagnostics — unified entry for palette, trace, and future stage adapters.
 * Original imports remain valid via re-exports from diagnostics/paletteContractCheck, traceStore, inspectorStore.
 */

export { validatePaletteContract, type PaletteCheckResult } from "./palette/contract";
export {
  setEnabled,
  isEnabled,
  startTrace,
  recordStep,
  endTrace,
  getTraceByElementId,
  setComputedForElement,
  clear,
  recordTrace,
  type TraceStepRecord,
  type TraceError,
  type TraceRecord,
} from "./trace/traceStore";
export {
  getInspectMode,
  setInspectMode,
  getHoveredId,
  setHoveredId,
  getPinnedId,
  setPinnedId,
  getTokenTraceView,
  setTokenTraceView,
  subscribe,
  type TokenTraceView,
} from "./trace/inspectorStore";
export {
  type PipelineStageId,
  type PipelineStageResult,
  PIPELINE_STAGE_ORDER,
  PIPELINE_STAGE_LABELS,
} from "./types";
