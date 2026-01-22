// src/logic/engines/decision-engine.ts
// Decision State Engine - Aggregates all step outcomes into canonical DecisionState

import type { DecisionState, DecisionSignal, UIBlock, DocumentBlock, RecommendedStep, ExpandedBlock, ExportArtifact } from "./decision-types";

/**
 * Aggregates outcomes from education, calculator, and other flows
 * into a single canonical DecisionState
 */
export function aggregateDecisionState(
  outcomes: any[],
  calculatorResults?: any,
  context?: Record<string, any>
): DecisionState {
  const signals: string[] = [];
  const blockers: string[] = [];
  const opportunities: string[] = [];

  // Process education outcomes
  outcomes.forEach((outcome: any) => {
    const outcomeData = outcome.outcome || outcome;
    
    // Process new semantic signal format (signals, blockers, opportunities)
    if (outcomeData.signals) {
      signals.push(...outcomeData.signals);
    }
    if (outcomeData.blockers) {
      blockers.push(...outcomeData.blockers);
    }
    if (outcomeData.opportunities) {
      opportunities.push(...outcomeData.opportunities);
    }

    // Legacy support: Convert old format (learned/flags) to new format
    const flags = outcomeData.flags || [];
    flags.forEach((flag: string) => {
      if (flag.includes("blocked")) {
        blockers.push(flag);
      } else if (flag.includes("opportunity") || flag.includes("understood")) {
        opportunities.push(flag);
      } else {
        signals.push(flag);
      }
    });

    const learned = outcomeData.learned || [];
    learned.forEach((item: string) => {
      const signal = extractSignalFromText(item);
      if (signal) signals.push(signal);
    });
  });

  // Process calculator results
  if (calculatorResults) {
    if (calculatorResults.totalLoss) {
      signals.push(`profit_drain:${calculatorResults.totalLoss}`);
    }
    if (calculatorResults.scoring?.score) {
      const score = calculatorResults.scoring.score;
      if (score >= 80) {
        opportunities.push("high_intent");
      } else if (score < 40) {
        blockers.push("low_intent");
      }
    }
  }

  // Build immediate view (mobile-first, decisive)
  const immediateView = buildImmediateView(signals, blockers, opportunities);

  // Build expanded view (accordion/explainer)
  const expandedView = buildExpandedView(outcomes, signals, blockers, opportunities);

  // Build export view (detailed, printable)
  const exportView = buildExportView(outcomes, calculatorResults, signals, blockers, opportunities);

  // Generate recommended next steps based on signals
  const recommendedNextSteps = generateRecommendedSteps(signals, blockers, opportunities, outcomes);

  // Generate export artifacts
  const exportArtifacts = generateExportArtifacts(signals, blockers, opportunities, outcomes, calculatorResults);

  return {
    signals: [...new Set(signals)], // Deduplicate
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

/**
 * Extract semantic signal from text
 * TODO: This could be enhanced with NLP or pattern matching
 */
function extractSignalFromText(text: string): string | null {
  const lower = text.toLowerCase();
  
  // Pattern matching for common signals
  if (lower.includes("profit") || lower.includes("drain")) return "profit_drain";
  if (lower.includes("safety") || lower.includes("trust")) return "safety_concern";
  if (lower.includes("appearance") || lower.includes("bids")) return "appearance_impact";
  if (lower.includes("cleanup") || lower.includes("clean")) return "cleanup_needed";
  
  return null;
}

/**
 * Build immediate view blocks (mobile-first, decisive)
 */
function buildImmediateView(
  signals: string[],
  blockers: string[],
  opportunities: string[]
): UIBlock[] {
  const blocks: UIBlock[] = [];

  // Critical blockers first
  if (blockers.length > 0) {
    blocks.push({
      type: "alert",
      severity: "high",
      title: "Blockers Detected",
      items: blockers,
    });
  }

  // Opportunities
  if (opportunities.length > 0) {
    blocks.push({
      type: "opportunity",
      severity: "medium",
      title: "Opportunities",
      items: opportunities,
    });
  }

  // Signals
  if (signals.length > 0) {
    blocks.push({
      type: "signal",
      severity: "low",
      title: "Key Signals",
      items: signals,
    });
  }

  return blocks;
}

/**
 * Build export view blocks (detailed, printable)
 */
function buildExportView(
  outcomes: any[],
  calculatorResults: any,
  signals: string[],
  blockers: string[],
  opportunities: string[]
): DocumentBlock[] {
  const blocks: DocumentBlock[] = [];

  // Summary section
  blocks.push({
    type: "summary",
    title: "Decision Summary",
    content: {
      signals,
      blockers,
      opportunities,
      totalSteps: outcomes.length,
      calculatorResult: calculatorResults,
    },
  });

  // Step-by-step breakdown
  if (outcomes.length > 0) {
    blocks.push({
      type: "steps",
      title: "Step-by-Step Analysis",
      items: outcomes.map((outcome: any) => ({
        stepId: outcome.stepId,
        choice: outcome.choiceLabel,
        outcome: outcome.outcome,
      })),
    });
  }

  // Action items
  const actionItems: string[] = [];
  blockers.forEach((blocker) => {
    actionItems.push(`Address blocker: ${blocker}`);
  });
  opportunities.forEach((opp) => {
    actionItems.push(`Leverage opportunity: ${opp}`);
  });

  if (actionItems.length > 0) {
    blocks.push({
      type: "actions",
      title: "Recommended Actions",
      items: actionItems,
    });
  }

  return blocks;
}

/**
 * Build expanded view blocks (accordion/explainer)
 */
function buildExpandedView(
  outcomes: any[],
  signals: string[],
  blockers: string[],
  opportunities: string[]
): ExpandedBlock[] {
  const blocks: ExpandedBlock[] = [];

  // Signal explanations
  if (signals.length > 0) {
    blocks.push({
      type: "explainer",
      title: "Key Signals Explained",
      content: "These signals indicate important patterns in your responses.",
      sections: signals.map((signal) => ({
        title: signal,
        content: `Explanation for ${signal} signal.`,
        expanded: false,
      })),
    });
  }

  // Blocker details
  if (blockers.length > 0) {
    blocks.push({
      type: "accordion",
      title: "Blockers & Challenges",
      content: "These items may prevent progress.",
      sections: blockers.map((blocker) => ({
        title: blocker,
        content: `Details about ${blocker} blocker.`,
        expanded: true, // Blockers expanded by default
      })),
    });
  }

  // Opportunity details
  if (opportunities.length > 0) {
    blocks.push({
      type: "accordion",
      title: "Opportunities",
      content: "These items represent potential value.",
      sections: opportunities.map((opp) => ({
        title: opp,
        content: `Details about ${opp} opportunity.`,
        expanded: false,
      })),
    });
  }

  return blocks;
}

/**
 * Generate recommended next steps based on signals
 */
function generateRecommendedSteps(
  signals: string[],
  blockers: string[],
  opportunities: string[],
  outcomes: any[]
): RecommendedStep[] {
  const steps: RecommendedStep[] = [];

  // High priority: address blockers
  blockers.forEach((blocker) => {
    steps.push({
      stepId: `address-${blocker}`,
      reason: `Address ${blocker} to remove blocker`,
      priority: "high",
      basedOn: [blocker],
    });
  });

  // Medium priority: leverage opportunities
  opportunities.forEach((opp) => {
    steps.push({
      stepId: `leverage-${opp}`,
      reason: `Leverage ${opp} to increase value`,
      priority: "medium",
      basedOn: [opp],
    });
  });

  // Low priority: monitor signals
  signals.forEach((signal) => {
    if (!blockers.includes(signal) && !opportunities.includes(signal)) {
      steps.push({
        stepId: `monitor-${signal}`,
        reason: `Monitor ${signal} signal`,
        priority: "low",
        basedOn: [signal],
      });
    }
  });

  return steps;
}

/**
 * Generate export artifacts
 */
function generateExportArtifacts(
  signals: string[],
  blockers: string[],
  opportunities: string[],
  outcomes: any[],
  calculatorResults: any
): ExportArtifact[] {
  const artifacts: ExportArtifact[] = [];

  // Checklist artifact
  const checklistItems: string[] = [];
  blockers.forEach((b) => checklistItems.push(`☐ Address: ${b}`));
  opportunities.forEach((o) => checklistItems.push(`☐ Leverage: ${o}`));
  
  if (checklistItems.length > 0) {
    artifacts.push({
      type: "checklist",
      title: "Action Checklist",
      content: checklistItems.join("\n"),
      format: "text",
    });
  }

  // Summary artifact
  artifacts.push({
    type: "summary",
    title: "Decision Summary",
    content: {
      signals,
      blockers,
      opportunities,
      totalSteps: outcomes.length,
      calculatorResult: calculatorResults,
    },
    format: "json",
  });

  // Action plan artifact
  const actionPlan: string[] = [];
  blockers.forEach((b) => {
    actionPlan.push(`Action: Address ${b} to prevent project delays`);
  });
  opportunities.forEach((o) => {
    actionPlan.push(`Opportunity: Leverage ${o} to improve outcomes`);
  });

  if (actionPlan.length > 0) {
    artifacts.push({
      type: "action-plan",
      title: "Action Plan",
      content: actionPlan.join("\n\n"),
      format: "text",
    });
  }

  return artifacts;
}
