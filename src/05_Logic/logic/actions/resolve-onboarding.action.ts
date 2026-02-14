// src/logic/actions/resolve-onboarding.action.ts

import { resolveOnboardingFromAnswers } from "@/logic/engines/Onboarding-flow-router";
import { resolveView } from "@/logic/runtime/flow-resolver";
import { writeEngineState, readEngineState } from "@/logic/runtime/engine-bridge";
import { dispatchState } from "@/state/state-store";
import { getState } from "@/state/state-store";
import type { DerivedState } from "@/state/state-resolver";

export function resolveOnboardingAction(action: any, state: Record<string, any>) {
  const fullState = getState();
  const engineState = readEngineState();

  // Merge state sources
  const mergedState = {
    ...fullState?.values,
    ...engineState,
    calculatorInput: engineState?.calculatorInput ?? fullState?.values?.calculatorInput,
  };

  // Get answers from various possible locations
  const answers =
    action?.answers ??
    fullState?.values?.answers ??
    engineState?.answers ??
    mergedState?.calculatorInput ??
    {};

  // Determine flow using onboarding router
  const flow = resolveOnboardingFromAnswers(answers);

  // Resolve the specific view for this flow
  const derivedState: DerivedState = {
    journal: {},
    rawCount: 0,
    interactions: fullState?.interactions ?? [],
  };
  const view = resolveView(flow, derivedState);

  // Update engine state with flow decision
  writeEngineState({
    currentFlow: flow,
    currentView: view,
    onboardingDecision: {
      flow,
      view,
      intentScore: (mergedState as Record<string, unknown>)?.intentScore,
    },
  });

  // Also update global state
  dispatchState("state.update", {
    key: "currentView",
    value: view,
  });

  dispatchState("state.update", {
    key: "currentFlow",
    value: flow,
  });
}
