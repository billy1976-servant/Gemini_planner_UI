/**
 * Wizard step actions — next/prev/goTo via action-registry.
 * Uses engine-bridge (currentFlow, currentStepIndex) when flow is loaded; else values.wizardStepIndex_<flowId>.
 */

import { getState, dispatchState } from "@/state/state-store";
import { readEngineState, writeEngineState } from "@/logic/runtime/engine-bridge";

const DEFAULT_FLOW_ID = "default";

/** Advance to next step. Uses engine state if currentFlow exists; else values.wizardStepIndex_<flowId> and values.wizardStepCount_<flowId>. */
export function wizardNext(
  action: { flowId?: string },
  _state: Record<string, any>
): void {
  const engine = readEngineState();
  const flow = engine?.currentFlow;
  const flowId = action.flowId ?? DEFAULT_FLOW_ID;

  if (flow?.steps?.length) {
    const current = typeof engine.currentStepIndex === "number" ? engine.currentStepIndex : 0;
    const next = Math.min(current + 1, flow.steps.length - 1);
    writeEngineState({ ...engine, currentStepIndex: next });
    return;
  }

  const key = `wizardStepIndex_${flowId}`;
  const countKey = `wizardStepCount_${flowId}`;
  const current = getState()?.values?.[key];
  const count = getState()?.values?.[countKey];
  const steps = typeof count === "number" ? count : 1;
  const idx = typeof current === "number" ? current : 0;
  const next = Math.min(idx + 1, steps - 1);
  dispatchState("state.update", { key, value: next });
}

/** Go to previous step. */
export function wizardPrev(
  action: { flowId?: string },
  _state: Record<string, any>
): void {
  const engine = readEngineState();
  const flow = engine?.currentFlow;
  const flowId = action.flowId ?? DEFAULT_FLOW_ID;

  if (flow?.steps?.length) {
    const current = typeof engine.currentStepIndex === "number" ? engine.currentStepIndex : 0;
    const next = Math.max(0, current - 1);
    writeEngineState({ ...engine, currentStepIndex: next });
    return;
  }

  const key = `wizardStepIndex_${flowId}`;
  const current = getState()?.values?.[key];
  const idx = typeof current === "number" ? current : 0;
  const next = Math.max(0, idx - 1);
  dispatchState("state.update", { key, value: next });
}

/** Jump to step by index or stepId. Payload: { stepIndex?: number, stepId?: string, flowId?: string }. */
export function wizardGoTo(
  action: { flowId?: string; stepIndex?: number; stepId?: string },
  _state: Record<string, any>
): void {
  const engine = readEngineState();
  const flow = engine?.currentFlow;
  const flowId = action.flowId ?? DEFAULT_FLOW_ID;

  if (flow?.steps?.length) {
    let target = action.stepIndex;
    if (target === undefined && typeof action.stepId === "string") {
      target = flow.steps.findIndex((s: any) => s.id === action.stepId);
    }
    if (typeof target === "number" && target >= 0 && target < flow.steps.length) {
      writeEngineState({ ...engine, currentStepIndex: target });
    }
    return;
  }

  const key = `wizardStepIndex_${flowId}`;
  const countKey = `wizardStepCount_${flowId}`;
  const count = getState()?.values?.[countKey];
  const steps = typeof count === "number" ? count : 1;
  let target = action.stepIndex;
  if (typeof target === "number" && target >= 0 && target < steps) {
    dispatchState("state.update", { key, value: target });
  }
}
