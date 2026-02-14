/**
 * Decision state aggregation — single entry under decision/.
 * Aggregates outcomes from education, calculator, and other flows into canonical DecisionState.
 */

import type {
  DecisionState,
  UIBlock,
  DocumentBlock,
  RecommendedStep,
  ExpandedBlock,
  ExportArtifact,
} from "./decision-types";

export function aggregateDecisionState(
  outcomes: any[],
  calculatorResults?: any,
  context?: Record<string, any>
): DecisionState {
  const signals: string[] = [];
  const blockers: string[] = [];
  const opportunities: string[] = [];

  outcomes.forEach((outcome: any) => {
    const outcomeData = outcome.outcome || outcome;
    if (outcomeData.signals) signals.push(...outcomeData.signals);
    if (outcomeData.blockers) blockers.push(...outcomeData.blockers);
    if (outcomeData.opportunities) opportunities.push(...outcomeData.opportunities);
    const flags = outcomeData.flags || [];
    flags.forEach((flag: string) => {
      if (flag.includes("blocked")) blockers.push(flag);
      else if (flag.includes("opportunity") || flag.includes("understood")) opportunities.push(flag);
      else signals.push(flag);
    });
    const learned = outcomeData.learned || [];
    learned.forEach((item: string) => {
      const signal = extractSignalFromText(item);
      if (signal) signals.push(signal);
    });
  });

  if (calculatorResults) {
    if (calculatorResults.totalLoss) signals.push(`profit_drain:${calculatorResults.totalLoss}`);
    if (calculatorResults.scoring?.score) {
      const score = calculatorResults.scoring.score;
      if (score >= 80) opportunities.push("high_intent");
      else if (score < 40) blockers.push("low_intent");
    }
  }

  const immediateView = buildImmediateView(signals, blockers, opportunities);
  const expandedView = buildExpandedView(outcomes, signals, blockers, opportunities);
  const exportView = buildExportView(outcomes, calculatorResults, signals, blockers, opportunities);
  const recommendedNextSteps = generateRecommendedSteps(signals, blockers, opportunities, outcomes);
  const exportArtifacts = generateExportArtifacts(
    signals,
    blockers,
    opportunities,
    outcomes,
    calculatorResults
  );

  return {
    signals: [...new Set(signals)],
    blockers: [...new Set(blockers)],
    opportunities: [...new Set(opportunities)],
    recommendedNextSteps,
    context: context || {},
    outputs: {
      immediateView,
      expandedView,
      exportView,
      exportArtifacts,
    },
  };
}

function extractSignalFromText(text: string): string | null {
  const lower = text.toLowerCase();
  if (lower.includes("profit") || lower.includes("drain")) return "profit_drain";
  if (lower.includes("safety") || lower.includes("trust")) return "safety_concern";
  if (lower.includes("appearance") || lower.includes("bids")) return "appearance_impact";
  if (lower.includes("cleanup") || lower.includes("clean")) return "cleanup_needed";
  return null;
}

function buildImmediateView(
  signals: string[],
  blockers: string[],
  opportunities: string[]
): UIBlock[] {
  const blocks: UIBlock[] = [];
  if (blockers.length > 0) {
    blocks.push({ type: "alert", severity: "high", title: "Blockers Detected", items: blockers });
  }
  if (opportunities.length > 0) {
    blocks.push({ type: "opportunity", severity: "medium", title: "Opportunities", items: opportunities });
  }
  if (signals.length > 0) {
    blocks.push({ type: "signal", severity: "low", title: "Key Signals", items: signals });
  }
  return blocks;
}

function buildExportView(
  outcomes: any[],
  calculatorResults: any,
  signals: string[],
  blockers: string[],
  opportunities: string[]
): DocumentBlock[] {
  const blocks: DocumentBlock[] = [];
  blocks.push({
    type: "summary",
    title: "Decision Summary",
    content: { signals, blockers, opportunities, totalSteps: outcomes.length, calculatorResult: calculatorResults },
    format: "json",
  } as DocumentBlock);
  if (outcomes.length > 0) {
    blocks.push({
      type: "steps",
      title: "Step-by-Step Analysis",
      content: outcomes.map((o: any) => ({ stepId: o.stepId, choice: o.choiceLabel, outcome: o.outcome })),
      format: "json",
    } as DocumentBlock);
  }
  const actionItems: string[] = [];
  blockers.forEach((b) => actionItems.push(`Address blocker: ${b}`));
  opportunities.forEach((o) => actionItems.push(`Leverage opportunity: ${o}`));
  if (actionItems.length > 0) {
    blocks.push({
      type: "action-plan",
      title: "Recommended Actions",
      content: { text: actionItems.join("\n") },
      format: "text",
    } as DocumentBlock);
  }
  return blocks;
}

function buildExpandedView(
  outcomes: any[],
  signals: string[],
  blockers: string[],
  opportunities: string[]
): ExpandedBlock[] {
  const blocks: ExpandedBlock[] = [];
  if (signals.length > 0) {
    blocks.push({
      type: "explainer",
      title: "Key Signals Explained",
      content: "These signals indicate important patterns in your responses.",
      sections: signals.map((s) => ({ title: s, content: `Explanation for ${s} signal.`, expanded: false })),
    });
  }
  if (blockers.length > 0) {
    blocks.push({
      type: "accordion",
      title: "Blockers & Challenges",
      content: "These items may prevent progress.",
      sections: blockers.map((b) => ({ title: b, content: `Details about ${b} blocker.`, expanded: true })),
    });
  }
  if (opportunities.length > 0) {
    blocks.push({
      type: "accordion",
      title: "Opportunities",
      content: "These items represent potential value.",
      sections: opportunities.map((o) => ({ title: o, content: `Details about ${o} opportunity.`, expanded: false })),
    });
  }
  return blocks;
}

function generateRecommendedSteps(
  signals: string[],
  blockers: string[],
  opportunities: string[],
  _outcomes: any[]
): RecommendedStep[] {
  const steps: RecommendedStep[] = [];
  blockers.forEach((b) => {
    steps.push({ stepId: `address-${b}`, reason: `Address ${b} to remove blocker`, priority: "high", basedOn: [b] });
  });
  opportunities.forEach((o) => {
    steps.push({ stepId: `leverage-${o}`, reason: `Leverage ${o} to increase value`, priority: "medium", basedOn: [o] });
  });
  signals.forEach((s) => {
    if (!blockers.includes(s) && !opportunities.includes(s)) {
      steps.push({ stepId: `monitor-${s}`, reason: `Monitor ${s} signal`, priority: "low", basedOn: [s] });
    }
  });
  return steps;
}

function generateExportArtifacts(
  signals: string[],
  blockers: string[],
  opportunities: string[],
  outcomes: any[],
  calculatorResults: any
): ExportArtifact[] {
  const artifacts: ExportArtifact[] = [];
  const checklistItems: string[] = [];
  blockers.forEach((b) => checklistItems.push(`☐ Address: ${b}`));
  opportunities.forEach((o) => checklistItems.push(`☐ Leverage: ${o}`));
  if (checklistItems.length > 0) {
    artifacts.push({ type: "checklist", title: "Action Checklist", content: checklistItems.join("\n"), format: "text" });
  }
  artifacts.push({
    type: "summary",
    title: "Decision Summary",
    content: { signals, blockers, opportunities, totalSteps: outcomes.length, calculatorResult: calculatorResults },
    format: "json",
  });
  const actionPlan: string[] = [];
  blockers.forEach((b) => actionPlan.push(`Action: Address ${b} to prevent project delays`));
  opportunities.forEach((o) => actionPlan.push(`Opportunity: Leverage ${o} to improve outcomes`));
  if (actionPlan.length > 0) {
    artifacts.push({ type: "action-plan", title: "Action Plan", content: actionPlan.join("\n\n"), format: "text" });
  }
  return artifacts;
}
