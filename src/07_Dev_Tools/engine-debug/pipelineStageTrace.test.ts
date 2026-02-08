/**
 * Pipeline stage trace contract: reset clears trace; record + getLastPipelineTrace
 * reflect the last action's pipeline. Used by behavior-listener (reset on action)
 * and InteractionTracerPanel (read trace for display).
 *
 * Run: npx ts-node -r tsconfig-paths/register src/engine/debug/pipelineStageTrace.test.ts
 */

import {
  resetPipelineTrace,
  recordStage,
  getLastPipelineTrace,
} from "./pipelineStageTrace";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`pipelineStageTrace test: ${message}`);
}

// After reset, trace is empty
resetPipelineTrace();
assert(getLastPipelineTrace().length === 0, "trace empty after reset");

// Record action pass then state pass; trace contains both
recordStage("action", "pass", "Action event dispatched: state:update");
recordStage("state", "pass", "State updated key: values.sectionLayoutPreset.features_section");
const trace = getLastPipelineTrace();
assert(trace.length >= 2, "trace has at least 2 entries");
assert(trace[0].stage === "action" && trace[0].status === "pass", "first record is action pass");
assert(trace[1].stage === "state" && trace[1].status === "pass", "second record is state pass");

// Reset again; trace is empty (simulates new action received)
resetPipelineTrace();
assert(getLastPipelineTrace().length === 0, "trace empty after second reset");

// Record one stage and verify
recordStage("action", "pass", "Action event dispatched: state:update");
assert(getLastPipelineTrace().length === 1 && getLastPipelineTrace()[0].stage === "action", "single action stage after reset");

console.log("pipelineStageTrace.test.ts: all checks passed.");
