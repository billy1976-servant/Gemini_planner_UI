// src/logic/runtime/landing-page-resolver.ts

import { resolveOnboardingFromAnswers } from "@/logic/engines/Onboarding-flow-router";
import { resolveContent } from "@/logic/content/content-resolver";
import { readEngineState } from "./engine-bridge";
import { getState } from "@/state/state-store";

/**
 * Determines the initial landing page based on user state
 * Uses onboarding flow router to decide priority
 */
export function resolveLandingPage() {
  const state = getState();
  const engineState = readEngineState();

  // Try to get answers from state or engine state (state may have answers in values or legacy shape)
  const stateWithAnswers = state as { answers?: Record<string, any>; values?: Record<string, any> };
  const engineWithAnswers = engineState as { answers?: Record<string, any>; calculatorInput?: Record<string, any> } | null;
  const answers =
    stateWithAnswers?.answers ??
    stateWithAnswers?.values ??
    engineWithAnswers?.answers ??
    engineWithAnswers?.calculatorInput ??
    {};

  // If no answers yet, return default landing page content
  if (!answers || Object.keys(answers).length === 0) {
    return {
      content: resolveContent("construction-cleanup"),
      flow: "calculator-1" as const,
    };
  }

  // Use onboarding router to determine flow
  const flow = resolveOnboardingFromAnswers(answers);

  // Resolve content based on flow decision
  let content;
  try {
    content = resolveContent("construction-cleanup");
  } catch {
    content = null;
  }

  return {
    content,
    flow,
  };
}

/**
 * Gets the current view/screen to display based on flow and state
 */
export function getCurrentView(): string {
  const state = getState();

  // If currentView is already set, use it
  if (state?.currentView) {
    return state.currentView;
  }

  // Otherwise, determine from landing page resolver
  const { flow } = resolveLandingPage();
  return flow;
}
