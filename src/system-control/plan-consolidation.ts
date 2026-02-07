/**
 * Plan consolidation: merge overlapping file scopes, dedupe actions,
 * produce unified refactor sequence with estimated safety and impact.
 * UI/orchestration only; no file writes.
 */

import type { MiniRefactorPlan } from "./types";
import type { CombinedRefactorPlan, SafetyBadge } from "./types";

/**
 * Consolidate multiple plans: merge affected paths, dedupe steps, order steps, estimate safety/impact.
 */
export function consolidatePlans(plans: MiniRefactorPlan[]): CombinedRefactorPlan {
  if (plans.length === 0) {
    return {
      orderedSteps: [],
      affectedPaths: [],
      estimatedSafety: "SAFE",
      estimatedRuntimeImpact: "low",
      planCount: 0,
    };
  }

  const affectedPaths = [...new Set(plans.flatMap((p) => p.affectedPaths))];
  const stepSet = new Set<string>();
  const orderedSteps: string[] = [];
  for (const plan of plans) {
    orderedSteps.push(plan.title);
    for (const s of plan.steps) {
      const norm = s.replace(/\s+/g, " ").trim().toLowerCase();
      if (norm && !stepSet.has(norm)) {
        stepSet.add(norm);
        orderedSteps.push(`  - ${s}`);
      }
    }
  }

  const hasHigh = plans.some((p) => p.safetyBadge === "HIGH" || p.safety === "risky");
  const hasMedium = plans.some((p) => p.safetyBadge === "MEDIUM" || p.safety === "medium");
  const estimatedSafety: SafetyBadge = hasHigh ? "HIGH" : hasMedium ? "MEDIUM" : "SAFE";

  const totalScope = plans.reduce((s, p) => s + p.scopeSize, 0);
  const estimatedRuntimeImpact = totalScope > 15 || plans.length > 5 ? "high" : totalScope > 5 || plans.length > 2 ? "medium" : "low";

  return {
    orderedSteps,
    affectedPaths,
    estimatedSafety,
    estimatedRuntimeImpact,
    planCount: plans.length,
  };
}
