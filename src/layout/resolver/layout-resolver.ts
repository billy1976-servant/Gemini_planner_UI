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
  if (!layoutId) return null;
  const pageDef = getPageLayoutById(layoutId);
  const componentDef = resolveComponentLayout(layoutId);
  if (!pageDef) return null;
  return {
    ...pageDef,
    moleculeLayout: componentDef ?? undefined,
  };
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
