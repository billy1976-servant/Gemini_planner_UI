/**
 * Builds a combined refactor proposal from selected mini plans.
 * Output is markdown/text only; no file writes.
 */

import type { MiniRefactorPlan } from "./types";

export type RefactorProposal = {
  markdown: string;
  steps: string[];
  safetyNotes: string[];
  scopeBoundaries: string[];
};

/**
 * Combine selected mini refactor plans into one structured proposal.
 */
export function buildRefactorProposal(selectedPlans: MiniRefactorPlan[]): RefactorProposal {
  const steps: string[] = [];
  const safetyNotes: string[] = [
    "Do NOT auto-apply. Execute only after review and approval.",
    "Do NOT modify core runtime, compiler, or state engines.",
    "Move/rename only when explicitly in plan and user-approved.",
  ];
  const scopeBoundaries: string[] = [];

  selectedPlans.forEach((plan, i) => {
    steps.push(`${i + 1}. ${plan.title}`);
    plan.steps.forEach((s) => steps.push(`   - ${s}`));
    if (plan.affectedPaths.length) {
      scopeBoundaries.push(...plan.affectedPaths);
    }
    if (plan.safety === "risky" || plan.safety === "medium") {
      safetyNotes.push(`Plan "${plan.title}" is ${plan.safety}: verify imports and tests after change.`);
    }
  });

  const uniqueScope = [...new Set(scopeBoundaries)];
  const summary = selectedPlans.map((p) => `- ${p.title} (impact: ${p.impact}, safety: ${p.safety})`).join("\n");

  const stepLines = selectedPlans.flatMap((plan, i) => {
    const out: string[] = [`${i + 1}. ${plan.title}`];
    plan.steps.forEach((s) => out.push(`   - ${s}`));
    return out;
  });

  const markdown = [
    "# Refactor Proposal (System Control Center)",
    "",
    "Generated from selected mini plans. **Read-only planning document.** No changes applied automatically.",
    "",
    "## Summary",
    "",
    summary,
    "",
    "## Step-by-step execution",
    "",
    ...stepLines,
    "",
    "## Safety notes",
    "",
    ...safetyNotes.map((n) => `- ${n}`),
    "",
    "## Scope boundaries (affected paths)",
    "",
    ...uniqueScope.map((p) => `- ${p}`),
    "",
    "---",
    "End of proposal. Use Copy Cursor Command or Create Task File to pass this to Cursor.",
  ].join("\n");

  return {
    markdown,
    steps,
    safetyNotes: [...new Set(safetyNotes)],
    scopeBoundaries: uniqueScope,
  };
}

/**
 * Build a Cursor-ready command string from the proposal.
 */
export function buildCursorCommandFromProposal(proposal: RefactorProposal): string {
  return [
    "Using the refactor proposal below, apply ONLY the selected plans. Do not move files or change imports unless the plan explicitly says to; suggest edits only unless I approve.",
    "",
    "## Selected plans summary",
    "",
    ...proposal.steps.filter((s) => !s.startsWith("   ")).map((s) => s.replace(/^\d+\.\s*/, "- ")),
    "",
    "## Safety",
    "",
    ...proposal.safetyNotes.map((n) => `- ${n}`),
    "",
    "## Affected paths",
    "",
    ...proposal.scopeBoundaries.map((p) => `- ${p}`),
  ].join("\n");
}

/**
 * Build task file content from the proposal.
 */
export function buildTaskFileFromProposal(proposal: RefactorProposal): string {
  return [
    "# Cursor Task — Refactor (from System Control Center)",
    "",
    "Execute the following in order. No automatic application.",
    "",
    "## Steps",
    "",
    ...proposal.steps.map((s, i) => `${i + 1}. ${s}`),
    "",
    "## Safety",
    "",
    ...proposal.safetyNotes.map((n) => `- ${n}`),
    "",
    "## Scope",
    "",
    ...proposal.scopeBoundaries.map((p) => `- ${p}`),
  ].join("\n");
}
