/**
 * Layout Requirement Registry: reads JSON requirement files and returns
 * required slots for a given layout ID. Used by the Compatibility Evaluator.
 */

import sectionRequirementsData from "@/layout/requirements/section-layout-requirements.json";
import cardRequirementsData from "@/layout/requirements/card-layout-requirements.json";
import organRequirementsData from "@/layout/requirements/organ-internal-layout-requirements.json";

export type LayoutType = "section" | "card" | "organ";

type LayoutRequirementsMap = Record<string, { requires?: string[] }>;
type SectionRoot = { layoutRequirements?: LayoutRequirementsMap };
type CardRoot = { layoutRequirements?: LayoutRequirementsMap };
type OrganRoot = { organLayoutRequirements?: Record<string, Record<string, string[]>> };

const sectionRoot = sectionRequirementsData as SectionRoot;
const cardRoot = cardRequirementsData as CardRoot;
const organRoot = organRequirementsData as OrganRoot;

const sectionMap = sectionRoot?.layoutRequirements ?? {};
const cardMap = cardRoot?.layoutRequirements ?? {};
const organMap = organRoot?.organLayoutRequirements ?? {};

function normalizeId(id: string): string {
  return (id ?? "").trim().toLowerCase();
}

/**
 * Returns the required slot names for the given layout type and ID.
 * For organ layout, pass organId and internalLayoutId as layoutId (or use getRequiredSlotsForOrgan).
 * Empty or missing requires means no required slots (always valid).
 */
export function getRequiredSlots(
  layoutType: LayoutType,
  layoutId: string,
  organId?: string
): string[] {
  const id = normalizeId(layoutId);
  if (!id) return [];

  if (layoutType === "section") {
    const entry = sectionMap[id];
    const requires = entry?.requires;
    return Array.isArray(requires) ? requires : [];
  }

  if (layoutType === "card") {
    const entry = cardMap[id];
    const requires = entry?.requires;
    return Array.isArray(requires) ? requires : [];
  }

  if (layoutType === "organ" && organId) {
    return getRequiredSlotsForOrgan(organId, layoutId);
  }

  return [];
}

/**
 * Returns the required slot names for an organ's internal layout.
 * organId and internalLayoutId must match the organ-internal-layout-requirements.json structure.
 */
export function getRequiredSlotsForOrgan(
  organId: string,
  internalLayoutId: string
): string[] {
  const oId = normalizeId(organId);
  const lId = normalizeId(internalLayoutId);
  if (!oId || !lId) return [];

  const byOrgan = organMap[oId];
  if (!byOrgan || typeof byOrgan !== "object") return [];

  const requires = byOrgan[lId];
  return Array.isArray(requires) ? requires : [];
}
