/**
 * Page layout resolver (section placement only).
 * Resolves a layout id (or template+slot) to page-level definition: containerWidth, split, backgroundVariant.
 * Inner arrangement is resolved by layout/component.
 */

import layoutDefinitions from "../data/layout-definitions.json";

export type PageLayoutDefinition = {
  containerWidth?: "contained" | "edge-to-edge" | "narrow" | "wide" | "full" | "split" | string;
  split?: { type: "split"; mediaSlot?: "left" | "right" };
  backgroundVariant?: "default" | "hero-accent" | "alt" | "dark";
};

type PageLayoutsMap = Record<string, PageLayoutDefinition>;
type TemplatesMap = Record<string, Record<string, string>>;

const pageLayouts = (layoutDefinitions as { pageLayouts: PageLayoutsMap }).pageLayouts;
const templates = (layoutDefinitions as { templates: TemplatesMap }).templates;

export function resolvePageLayout(
  layout: string | { template: string; slot: string } | null | undefined,
  context?: { templateId?: string; sectionRole?: string }
): PageLayoutDefinition | null {
  const id = getPageLayoutId(layout, context);
  if (!id) return null;
  return getPageLayoutById(id);
}

export function getPageLayoutById(id: string): PageLayoutDefinition | null {
  const normalized = id.trim().toLowerCase();
  const def = pageLayouts[normalized] ?? pageLayouts[id];
  return def && typeof def === "object" ? def : null;
}

/**
 * Get the page layout id from layout reference or context (for use by unified layout merge).
 */
export function getPageLayoutId(
  layout: string | { template: string; slot: string } | null | undefined,
  context?: { templateId?: string; sectionRole?: string }
): string | null {
  if (layout == null) {
    if (context?.templateId && context?.sectionRole) {
      const templateMap = templates[context.templateId];
      if (!templateMap) return null;
      const layoutId = templateMap[context.sectionRole];
      return layoutId && typeof layoutId === "string" ? layoutId.trim() : null;
    }
    return null;
  }
  if (typeof layout === "string") {
    const id = layout.trim();
    return id || null;
  }
  if (typeof layout === "object" && layout !== null && "template" in layout && "slot" in layout) {
    const { template, slot } = layout;
    const templateMap = templates[template];
    if (!templateMap) return null;
    const layoutId = templateMap[slot];
    return layoutId && typeof layoutId === "string" ? layoutId.trim() : null;
  }
  return null;
}

/** All page layout ids (for dropdowns). */
export function getPageLayoutIds(): string[] {
  return Object.keys(pageLayouts);
}

/** Default page layout id when no override and no explicit node.layout. From template JSON only; no fallback. */
export function getDefaultSectionLayoutId(templateId: string | undefined): string | undefined {
  if (templateId && templates[templateId]) {
    const defaultId = templates[templateId]["defaultLayout"];
    if (typeof defaultId === "string" && defaultId.trim()) return defaultId.trim();
  }
  return undefined;
}

export { templates };
