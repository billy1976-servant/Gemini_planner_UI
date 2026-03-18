"use client";


/**
 * Onboarding Flow Router
 *
 * PURPOSE:
 * - Deterministically choose which onboarding / marketing flow to show
 * - NEVER import TSX screens
 * - NEVER render UI
 * - ONLY return screen IDs
 */


import { run25X } from "@/logic/engines/25x.engine";


/* -------------------------------------------------- */
/* Types                                              */
/* -------------------------------------------------- */


export type OnboardingContext = {
  answers?: Record<string, any>;
  intentScore?: number;
  wantsPricing?: boolean;
};


export type FlowDecision =
  | "calculator-1"
  | "pricing-jump-flow"
  | "education-flow";


/* -------------------------------------------------- */
/* Core Flow Resolver                                 */
/* -------------------------------------------------- */


export function resolveOnboardingFlow(
  context: OnboardingContext
): FlowDecision {
  const intent = context.intentScore ?? 0;
  const wantsPricing = context.wantsPricing ?? false;


  // HARD INTENT → pricing
  if (wantsPricing || intent >= 80) {
    return "pricing-jump-flow";
  }


  // MID INTENT → education
  if (intent >= 40) {
    return "education-flow";
  }


  // DEFAULT → calculator discovery
  return "calculator-1";
}


/* -------------------------------------------------- */
/* 25× ENGINE ADAPTER (IMPORTANT)                     */
/* -------------------------------------------------- */


export function resolveOnboardingFromAnswers(
  answers: Record<string, any>
): FlowDecision {
  /**
   * run25X DOES NOT return a number.
   * It returns a structured object.
   */
  const result = run25X({}, answers);



  const intentScore =
    typeof result?.scoring?.score === "number"
      ? result.scoring.score
      : 0;


  return resolveOnboardingFlow({
    answers,
    intentScore,
    wantsPricing: answers?.wantsPricing === true,
  });
}


