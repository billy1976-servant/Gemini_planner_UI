/**
 * Single authority for section layout id resolution.
 * Authority ladder: override (store) → node.layout → template role → template default → undefined.
 * Used by JsonRenderer; no duplicate "which layout id" logic in engine.
 */

import {
  getDefaultSectionLayoutId as getDefaultFromTemplate,
  getPageLayoutId,
} from "@/layout/page";
import { pushTrace } from "@/devtools/runtime-trace-store";
import { addTraceEvent } from "@/03_Runtime/debug/pipeline-trace-aggregator";

export type GetSectionLayoutIdArgs = {
  /** Section key (node.id ?? node.role ?? ""). */
  sectionKey: string;
  /** Section node; only id, role, layout are used. */
  node: { id?: string; role?: string; layout?: string };
  /** Template id from profile (e.g. profile.id). */
  templateId: string | null | undefined;
  /** Per-section overrides (e.g. from section-layout-preset store). */
  sectionLayoutPresetOverrides?: Record<string, string>;
  /** If set, used as template default instead of getDefaultSectionLayoutId(templateId). */
  defaultSectionLayoutIdFromProfile?: string | null;
};

export type GetSectionLayoutIdResult = {
  layoutId: string;
  ruleApplied: "override" | "explicit node.layout" | "template role" | "template default" | "fallback";
};

/**
 * Resolve the section layout id for a section node.
 * Single source of truth: override → explicit node.layout → template role → template default → "content-stack" fallback.
 * Never returns undefined; always returns a valid layout ID.
 */
export function getSectionLayoutId(args: GetSectionLayoutIdArgs): string;
export function getSectionLayoutId(
  args: GetSectionLayoutIdArgs,
  opts: { includeRule: true }
): GetSectionLayoutIdResult;
export function getSectionLayoutId(
  args: GetSectionLayoutIdArgs,
  opts?: { includeRule?: boolean }
): string | GetSectionLayoutIdResult {
  const {
    sectionKey,
    node,
    templateId,
    sectionLayoutPresetOverrides,
    defaultSectionLayoutIdFromProfile,
  } = args;

  // Guard: If sectionKey is empty, null, or undefined, use fallback immediately
  const effectiveSectionKey = (sectionKey && sectionKey.trim()) ? sectionKey.trim() : null;
  
  const overrideId =
    effectiveSectionKey && sectionLayoutPresetOverrides?.[effectiveSectionKey]?.trim()
      ? sectionLayoutPresetOverrides[effectiveSectionKey].trim()
      : null;
  const existingLayoutId =
    typeof node.layout === "string" && node.layout.trim()
      ? node.layout.trim()
      : null;
  const templateDefaultLayoutId =
    (defaultSectionLayoutIdFromProfile && defaultSectionLayoutIdFromProfile.trim()) ||
    getDefaultFromTemplate(templateId ?? undefined) ||
    null;
  const templateRoleLayoutId =
    !existingLayoutId && !overrideId && templateId && (node.role ?? "").toString().trim()
      ? (getPageLayoutId(null, {
          templateId,
          sectionRole: (node.role ?? "").toString().trim(),
        }) ?? null)
      : null;

  // Resolve layout ID with deterministic fallback
  let layoutId: string;
  let ruleApplied: GetSectionLayoutIdResult["ruleApplied"];
  
  if (overrideId) {
    layoutId = overrideId;
    ruleApplied = "override";
  } else if (existingLayoutId) {
    layoutId = existingLayoutId;
    ruleApplied = "explicit node.layout";
  } else if (templateRoleLayoutId?.trim()) {
    layoutId = templateRoleLayoutId.trim();
    ruleApplied = "template role";
  } else if (templateDefaultLayoutId) {
    layoutId = templateDefaultLayoutId;
    ruleApplied = "template default";
  } else {
    // Deterministic fallback: always return "content-stack" instead of undefined
    layoutId = "content-stack";
    ruleApplied = "fallback";
    
    // Debug logging for fallback usage
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `[getSectionLayoutId] Fallback to "content-stack" for section:`,
        {
          sectionKey: effectiveSectionKey || "(empty/null/undefined)",
          nodeId: node.id,
          nodeRole: node.role,
          templateId: templateId || "(none)",
          reason: !effectiveSectionKey 
            ? "empty sectionKey" 
            : "all resolution paths failed (no override, node.layout, template role, or template default)",
        }
      );
    }
  }

  // Trace layout source priority chain
  const traceSectionId = effectiveSectionKey || "(empty)";
  pushTrace({
    system: "layout",
    sectionId: traceSectionId,
    action: "getSectionLayoutId",
    input: {
      nodeLayout: existingLayoutId,
      nodeRole: node.role,
      templateId,
      templateDefaultFromProfile: defaultSectionLayoutIdFromProfile,
      overrideId,
      sectionKeyEmpty: !effectiveSectionKey,
    },
    decision: ruleApplied,
    override: overrideId || undefined,
    final: {
      layoutId,
      ruleApplied,
      priorityChain: {
        override: overrideId || null,
        explicit: existingLayoutId || null,
        templateRole: templateRoleLayoutId || null,
        templateDefault: templateDefaultLayoutId || null,
        fallback: ruleApplied === "fallback" ? "content-stack" : null,
      },
    },
  });
  
  // Add to consolidated trace aggregator (as resolver)
  addTraceEvent({
    system: "resolver",
    sectionId: traceSectionId,
    action: "getSectionLayoutId",
    input: {
      nodeLayout: existingLayoutId,
      nodeRole: node.role,
      templateId,
      templateDefaultFromProfile: defaultSectionLayoutIdFromProfile,
      overrideId,
      sectionKeyEmpty: !effectiveSectionKey,
    },
    decision: ruleApplied,
    override: overrideId || undefined,
    final: {
      layoutId,
      ruleApplied,
      priorityChain: {
        override: overrideId || null,
        explicit: existingLayoutId || null,
        templateRole: templateRoleLayoutId || null,
        templateDefault: templateDefaultLayoutId || null,
        fallback: ruleApplied === "fallback" ? "content-stack" : null,
      },
    },
  });


  if (opts?.includeRule) {
    return { layoutId, ruleApplied };
  }
  return layoutId;
}
