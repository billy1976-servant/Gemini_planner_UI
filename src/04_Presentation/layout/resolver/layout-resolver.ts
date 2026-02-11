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
import { trace } from "@/devtools/interaction-tracer.store";
import { PipelineDebugStore } from "@/devtools/pipeline-debug-store";
import { recordStage } from "@/engine/debug/pipelineStageTrace";
import { pushTrace } from "@/devtools/runtime-trace-store";
import { addTraceEvent } from "@/03_Runtime/debug/pipeline-trace-aggregator";

// Global debug flag for layout source tracing
const TRACE_LAYOUT_SOURCE = true;

export type LayoutDefinition = {
  containerWidth?: "contained" | "edge-to-edge" | "narrow" | "wide" | "full" | "split" | string;
  split?: { type: "split"; mediaSlot?: "left" | "right" };
  backgroundVariant?: "default" | "hero-accent" | "alt" | "dark";
  moleculeLayout?: {
    type: "column" | "row" | "grid" | "stacked";
    preset?: string | null;
    params?: Record<string, unknown>;
  };
  container?: {
    width?: string;
    marginLeft?: string;
    marginRight?: string;
    boxSizing?: string;
    overflowX?: string;
  };
};

/**
 * Resolve a layout reference to a full layout definition (page + component layout merged).
 */
export function resolveLayout(
  layout: string | { template: string; slot: string } | null | undefined,
  context?: { templateId?: string; sectionRole?: string }
): LayoutDefinition | null {
  if (process.env.NODE_ENV === "development") {
    PipelineDebugStore.mark("layout-resolver", "resolveLayout.entry", {
      layoutId: typeof layout === "string" ? layout : null,
      sectionId: context?.sectionRole ?? null,
    });
  }
  const layoutId = getPageLayoutId(layout, context);
  const sectionKey = context?.sectionRole ?? layoutId ?? "(unknown)";
  
  if (!layoutId) {
    // Trace failure
    pushTrace({
      system: "layout",
      sectionId: sectionKey,
      action: "resolveLayout",
      input: { layout, context },
      decision: null,
      final: null,
    });
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
    pushTrace({
      system: "layout",
      sectionId: sectionKey,
      action: "resolveLayout",
      input: { layout, context, layoutId },
      decision: null,
      final: null,
    });
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
  
  // Trace successful resolution
  const templateDefault = context?.templateId ? getDefaultFromPage(context.templateId) : undefined;
  pushTrace({
    system: "layout",
    sectionId: sectionKey,
    action: "resolveLayout",
    input: { layout, context },
    decision: layoutId,
    override: templateDefault ? `template:${templateDefault}` : undefined,
    final: {
      layoutId,
      hasPageDef: !!pageDef,
      hasComponentDef: !!componentDef,
      containerWidth: pageDef?.containerWidth,
      split: pageDef?.split,
      backgroundVariant: pageDef?.backgroundVariant,
    },
  });
  
  // Add to consolidated trace aggregator
  addTraceEvent({
    system: "layout",
    sectionId: sectionKey,
    action: "resolveLayout",
    input: { layout, context },
    decision: layoutId,
    override: templateDefault ? `template:${templateDefault}` : undefined,
    final: {
      layoutId,
      hasPageDef: !!pageDef,
      hasComponentDef: !!componentDef,
      containerWidth: pageDef?.containerWidth,
      split: pageDef?.split,
      backgroundVariant: pageDef?.backgroundVariant,
    },
  });
  
  logRuntimeDecision({
    timestamp: Date.now(),
    engineId: "layout-resolver",
    decisionType: "layout-choice",
    inputsSeen: { layout: layout ?? null, context: context ?? null, layoutId },
    ruleApplied: "getPageLayoutId + getPageLayoutById + resolveComponentLayout",
    decisionMade: { layoutId, hasMoleculeLayout: !!componentDef },
    downstreamEffect: "merged page + component layout",
  });
  trace({ time: Date.now(), type: "layout", label: layoutId });
  const before = PipelineDebugStore.getSnapshot
    ? PipelineDebugStore.getSnapshot()
    : null;
  const prevLayout = before?.layoutMap?.[sectionKey];
  PipelineDebugStore.setLayout(sectionKey, layoutId);
  const after = PipelineDebugStore.getSnapshot
    ? PipelineDebugStore.getSnapshot()
    : null;
  const nextLayout = after?.layoutMap?.[sectionKey];
  if (prevLayout !== nextLayout) {
    recordStage("layout", "pass", "Layout recalculated for sections");
  } else {
    recordStage("layout", "fail", "Layout resolver ran but no layout changes detected");
  }
  if (process.env.NODE_ENV === "development") {
    PipelineDebugStore.mark("layout-resolver", "resolveLayout.exit", {
      layoutId,
      sectionKey,
    });
  }
  return result;
}

/** Section (page) layout ids for dropdowns and compatibility filtering. Preferred public API. */
export function getSectionLayoutIds(): string[] {
  return getPageLayoutIds();
}

/**
 * @deprecated Use getSectionLayoutIds(). Legacy alias for section layout ID set (page-layouts.json keys).
 */
export function getLayout2Ids(): string[] {
  return getPageLayoutIds();
}

/** Default layout id for a section when no override and no explicit node.layout. */
export function getDefaultSectionLayoutId(templateId: string | undefined): string | undefined {
  return getDefaultFromPage(templateId);
}

/** Single authority: resolve section layout id (override → node.layout → template role → template default). */
export { getSectionLayoutId } from "@/layout/section-layout-id";

export default resolveLayout;
