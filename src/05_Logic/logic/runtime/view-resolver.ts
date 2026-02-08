// src/logic/runtime/view-resolver.ts
// Multi-format view resolver - ImmediateView, ExpandedView, ExportView
// Used by summary/export flows when decision engine is active. Not on main JSON screen path; legacy/secondary.

import type { DecisionState, UIBlock, ExpandedBlock, DocumentBlock } from "../engines/decision-types";
import { resolveBusinessProfile } from "../config/business-profiles";

/**
 * Resolve ImmediateView (mobile-first, compressed)
 */
export function resolveImmediateView(decisionState: DecisionState): UIBlock[] {
  return decisionState.outputs.immediateView.map((block) => {
    // Enhance with business-specific labels if available
    const profile = resolveBusinessProfile(decisionState.context);
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
 * Resolve ExpandedView (accordion/explainer)
 */
export function resolveExpandedView(decisionState: DecisionState): ExpandedBlock[] {
  return decisionState.outputs.expandedView.map((block) => {
    const profile = resolveBusinessProfile(decisionState.context);
    return {
      ...block,
      title: profile.content.labels[block.title] || block.title,
      content: block.content,
      sections: block.sections?.map((section) => ({
        ...section,
        title: profile.content.labels[section.title] || section.title,
        content: profile.content.explanations[section.title] || section.content,
      })),
    };
  });
}

/**
 * Resolve ExportView (print/PDF/checklist)
 */
export function resolveExportView(decisionState: DecisionState): DocumentBlock[] {
  return decisionState.outputs.exportView.map((block) => {
    const profile = resolveBusinessProfile(decisionState.context);
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

/**
 * Get export artifacts (checklist, summary, action plan, etc.)
 */
export function getExportArtifacts(decisionState: DecisionState) {
  return decisionState.outputs.exportArtifacts;
}
