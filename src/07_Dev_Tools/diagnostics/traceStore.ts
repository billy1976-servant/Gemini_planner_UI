/** Re-export from pipeline for backward compatibility. Do not remove. */
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
} from "./pipeline/trace/traceStore";
