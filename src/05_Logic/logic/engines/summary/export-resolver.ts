// src/logic/runtime/export-resolver.ts
// Export resolver - generates immediateView and exportView from EngineState.exportSlices
// Callers should ensure export capability is on (e.g. via action gating or getCapabilityLevel).

import type { DecisionState, UIBlock, DocumentBlock } from "../decision/decision-types";
import type { EngineState, ExportSlice } from "../../runtime/engine-state";
import { resolveBusinessProfile } from "@/logic/config/business-profiles";
import { getCapabilityLevel } from "@/03_Runtime/capability";

/**
 * Resolve immediate view blocks (mobile-first, decisive)
 */
export function resolveImmediateView(decisionState: DecisionState): UIBlock[] {
  const profile = resolveBusinessProfile(decisionState.context);
  
  return decisionState.outputs.immediateView.map((block) => {
    // Enhance blocks with business-specific labels
    return {
      ...block,
      title: profile.content.labels[block.title] || block.title,
      items: block.items.map((item) => {
        const signal = item.split(":")[0];
        return profile.content.labels[signal] || item;
      }),
    };
  });
}

/**
 * Resolve export view blocks (detailed, printable)
 */
export function resolveExportView(decisionState: DecisionState): DocumentBlock[] {
  const profile = resolveBusinessProfile(decisionState.context);
  
  return decisionState.outputs.exportView.map((block) => {
    // Enhance blocks with business-specific content
    return {
      ...block,
      title: profile.content.labels[block.title] || block.title,
      metadata: {
        ...block.metadata,
        businessProfile: profile.id,
        generatedAt: new Date().toISOString(),
      },
    };
  });
}

function isExportAllowed(): boolean {
  const level = getCapabilityLevel("export");
  const s = typeof level === "string" ? level : (level as Record<string, string>)?.level ?? "off";
  return s !== "off";
}

/**
 * Generate checklist export from EngineState.exportSlices
 */
export function generateChecklist(engineState: EngineState, context?: Record<string, any>): DocumentBlock {
  if (!isExportAllowed()) {
    return { type: "checklist", title: "", items: [], metadata: { generatedAt: new Date().toISOString() } };
  }
  const profile = resolveBusinessProfile(context || {});
  const items: string[] = [];

  // Use exportSlices instead of raw outcomes
  engineState.exportSlices.forEach((slice) => {
    if (slice.blockers.length > 0) {
      slice.blockers.forEach((blocker) => {
        const signal = blocker.split(":")[0];
        const label = profile.content.labels[signal] || blocker;
        items.push(`☐ Address: ${label} (${slice.stepTitle})`);
      });
    }
    if (slice.opportunities.length > 0) {
      slice.opportunities.forEach((opp) => {
        const signal = opp.split(":")[0];
        const label = profile.content.labels[signal] || opp;
        items.push(`☐ Leverage: ${label} (${slice.stepTitle})`);
      });
    }
  });

  return {
    type: "checklist",
    title: `${profile.name} Action Checklist`,
    items,
    metadata: {
      businessProfile: profile.id,
      generatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Generate contractor summary from EngineState.exportSlices
 */
export function generateContractorSummary(engineState: EngineState, context?: Record<string, any>): DocumentBlock {
  if (!isExportAllowed()) {
    return {
      type: "summary",
      title: "",
      content: { signals: [], blockers: [], opportunities: [], context: context || {} },
      metadata: { generatedAt: new Date().toISOString() },
    };
  }
  const profile = resolveBusinessProfile(context || {});
  
  // Aggregate from exportSlices
  const allSignals = new Set<string>();
  const allBlockers = new Set<string>();
  const allOpportunities = new Set<string>();
  
  engineState.exportSlices.forEach((slice) => {
    slice.signals.forEach((s) => allSignals.add(s));
    slice.blockers.forEach((b) => allBlockers.add(b));
    slice.opportunities.forEach((o) => allOpportunities.add(o));
  });
  
  return {
    type: "summary",
    title: `${profile.name} Summary`,
    content: {
      signals: Array.from(allSignals).map((s) => {
        const signal = s.split(":")[0];
        return {
          signal: s,
          label: profile.content.labels[signal] || signal,
          explanation: profile.content.explanations[signal] || "",
        };
      }),
      blockers: Array.from(allBlockers),
      opportunities: Array.from(allOpportunities),
      context: context || {},
    },
    metadata: {
      businessProfile: profile.id,
      generatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Generate homeowner action plan from EngineState.exportSlices
 */
export function generateHomeownerActionPlan(engineState: EngineState, context?: Record<string, any>): DocumentBlock {
  if (!isExportAllowed()) {
    return { type: "actions", title: "", items: [], metadata: { generatedAt: new Date().toISOString() } };
  }
  const profile = resolveBusinessProfile(context || {});
  const items: string[] = [];

  // Use exportSlices instead of raw outcomes
  engineState.exportSlices.forEach((slice) => {
    slice.blockers.forEach((blocker) => {
      const signal = blocker.split(":")[0];
      const label = profile.content.labels[signal] || blocker;
      items.push(`Action: Address ${label} to prevent project delays (${slice.stepTitle})`);
    });

    slice.opportunities.forEach((opp) => {
      const signal = opp.split(":")[0];
      const label = profile.content.labels[signal] || opp;
      items.push(`Opportunity: Leverage ${label} to improve outcomes (${slice.stepTitle})`);
    });
  });

  return {
    type: "actions",
    title: "Homeowner Action Plan",
    items,
    metadata: {
      businessProfile: profile.id,
      generatedAt: new Date().toISOString(),
    },
  };
}
