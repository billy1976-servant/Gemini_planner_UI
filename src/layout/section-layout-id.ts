/**
 * Single authority for section layout id resolution.
 * Authority ladder: override (store) → node.layout → template role → template default → undefined.
 * Used by JsonRenderer; no duplicate "which layout id" logic in engine.
 */

import {
  getDefaultSectionLayoutId as getDefaultFromTemplate,
  getPageLayoutId,
} from "@/layout/page";

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
  layoutId: string | undefined;
  ruleApplied: "override" | "explicit node.layout" | "template role" | "template default" | "undefined";
};

/**
 * Resolve the section layout id for a section node.
 * Single source of truth: override → explicit node.layout → template role → template default → undefined.
 */
export function getSectionLayoutId(args: GetSectionLayoutIdArgs): string | undefined;
export function getSectionLayoutId(
  args: GetSectionLayoutIdArgs,
  opts: { includeRule: true }
): GetSectionLayoutIdResult;
export function getSectionLayoutId(
  args: GetSectionLayoutIdArgs,
  opts?: { includeRule?: boolean }
): string | undefined | GetSectionLayoutIdResult {
  const {
    sectionKey,
    node,
    templateId,
    sectionLayoutPresetOverrides,
    defaultSectionLayoutIdFromProfile,
  } = args;

  const overrideId =
    sectionLayoutPresetOverrides?.[sectionKey]?.trim() || null;
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

  const layoutId =
    overrideId ||
    existingLayoutId ||
    (templateRoleLayoutId?.trim() ? templateRoleLayoutId.trim() : null) ||
    templateDefaultLayoutId ||
    undefined;

  const ruleApplied: GetSectionLayoutIdResult["ruleApplied"] =
    overrideId
      ? "override"
      : existingLayoutId
      ? "explicit node.layout"
      : templateRoleLayoutId?.trim()
      ? "template role"
      : templateDefaultLayoutId
      ? "template default"
      : "undefined";

  if (opts?.includeRule) {
    return { layoutId, ruleApplied };
  }
  return layoutId;
}
