/**
 * Layout dependency rules: section layout → allowed card/organ options.
 * Used by the visual layout tile picker to filter options. Does not change persistence or state shape.
 */

import { getAllowedCardPresetsForSectionPreset } from "@/layout";

export type Option = { id: string; label: string; thumbnail?: unknown; description?: string };

/**
 * Returns card layout options allowed for the given section layout.
 * If no mapping exists for sectionLayoutId, returns all options (safe fallback).
 */
export function getAllowedCardLayouts(
  sectionLayoutId: string,
  allCardLayouts: Option[]
): Option[] {
  const id = (sectionLayoutId ?? "").toString().trim() || "";
  const allowedIds = getAllowedCardPresetsForSectionPreset(id || null);
  if (allowedIds.length === 0) return [];
  const set = new Set(allowedIds);
  const filtered = allCardLayouts.filter((o) => set.has(o.id));
  if (filtered.length === 0 && allCardLayouts.length > 0 && process.env.NODE_ENV === "development") {
    console.warn("[layoutDependencies] No card layouts match allowed ids for section:", id, "allowed:", allowedIds);
  }
  return filtered.length > 0 ? filtered : allCardLayouts;
}

/**
 * Optional: organ internal layout options per section. Default fallback returns all options.
 */
export function getAllowedOrganLayouts(
  _sectionLayoutId: string,
  allOrganLayouts: Option[]
): Option[] {
  return allOrganLayouts;
}
