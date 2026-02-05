/**
 * Layout resolver: merges page layout (section placement) and component layout (inner arrangement).
 * Page layout from src/layout/page; component layout from src/layout/component.
 * Used by SectionCompound and LayoutMoleculeRenderer. API unchanged for backward compatibility.
 */

import {
  getPageLayoutById,
  getPageLayoutId,
  getPageLayoutIds,
  getDefaultSectionLayoutId as getDefaultFromPage,
} from "@/layout/page";
import { resolveComponentLayout } from "@/layout/component";
import { logRuntimeDecision } from "@/engine/devtools/runtime-decision-trace";

export type LayoutDefinition = {
  containerWidth?: "contained" | "edge-to-edge" | "narrow" | "wide" | "full" | "split" | string;
  split?: { type: "split"; mediaSlot?: "left" | "right" };
  backgroundVariant?: "default" | "hero-accent" | "alt" | "dark";
  moleculeLayout?: {
    type: "column" | "row" | "grid" | "stacked";
    preset?: string | null;
    params?: Record<string, unknown>;
  };
};

/**
 * Resolve a layout reference to a full layout definition (page + component layout merged).
 */
export function resolveLayout(
  layout: string | { template: string; slot: string } | null | undefined,
  context?: { templateId?: string; sectionRole?: string }
): LayoutDefinition | null {
  const layoutId = getPageLayoutId(layout, context);
  if (!layoutId) {
    logRuntimeDecision({
      timestamp: Date.now(),
      engineId: "layout-resolver",
      decisionType: "layout-choice",
      inputsSeen: { layout: layout ?? null, context: context ?? null },
      ruleApplied: "getPageLayoutId returned null or missing pageDef",
      decisionMade: null,
      downstreamEffect: "no layout definition",
    });
    return null;
  }
  const pageDef = getPageLayoutById(layoutId);
  const componentDef = resolveComponentLayout(layoutId);
  if (!pageDef) {
    logRuntimeDecision({
      timestamp: Date.now(),
      engineId: "layout-resolver",
      decisionType: "layout-choice",
      inputsSeen: { layout: layout ?? null, context: context ?? null, layoutId },
      ruleApplied: "getPageLayoutById returned null",
      decisionMade: null,
      downstreamEffect: "no layout definition",
    });
    return null;
  }
  const result = {
    ...pageDef,
    moleculeLayout: componentDef ?? undefined,
  };
  logRuntimeDecision({
    timestamp: Date.now(),
    engineId: "layout-resolver",
    decisionType: "layout-choice",
    inputsSeen: { layout: layout ?? null, context: context ?? null, layoutId },
    ruleApplied: "getPageLayoutId + getPageLayoutById + resolveComponentLayout",
    decisionMade: { layoutId, hasMoleculeLayout: !!componentDef },
    downstreamEffect: "merged page + component layout",
  });
  return result;
}

/** All layout ids (page layout ids; for dropdowns). */
export function getLayout2Ids(): string[] {
  return getPageLayoutIds();
}

/** Default layout id for a section when no override and no explicit node.layout. */
export function getDefaultSectionLayoutId(templateId: string | undefined): string | undefined {
  return getDefaultFromPage(templateId);
}

export default resolveLayout;
