/**
 * JSON-driven layout resolver (layout-2 parallel system).
 * Resolves a layout key (string or template+slot) to a full layout definition.
 * Used by SectionCompound in parallel with the existing layout engine; does not replace it.
 */

import layoutsData from "./layouts.json";
import templatesData from "./templates.json";

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

type LayoutsMap = Record<string, LayoutDefinition>;
type TemplatesMap = Record<string, Record<string, string>>;

const layouts = layoutsData as LayoutsMap;
const templates = templatesData as TemplatesMap;

/**
 * Resolve a layout reference to a full layout definition.
 * @param layout - Either a layout id string (e.g. "hero-split") or { template, slot } (e.g. { template: "startup-template", slot: "hero" })
 * @param context - Optional: { templateId, sectionRole } used when layout is not provided (e.g. resolve by role from template)
 * @returns The layout definition from layouts.json, or null if not found
 */
export function resolveLayout(
  layout: string | { template: string; slot: string } | null | undefined,
  context?: { templateId?: string; sectionRole?: string }
): LayoutDefinition | null {
  if (layout == null) {
    if (context?.templateId && context?.sectionRole) {
      const templateMap = templates[context.templateId];
      if (!templateMap) return null;
      const layoutId = templateMap[context.sectionRole];
      if (!layoutId || typeof layoutId !== "string") return null;
      return getLayoutById(layoutId);
    }
    return null;
  }

  if (typeof layout === "string") {
    const id = layout.trim();
    if (!id) return null;
    return getLayoutById(id);
  }

  if (typeof layout === "object" && layout !== null && "template" in layout && "slot" in layout) {
    const { template, slot } = layout;
    const templateMap = templates[template];
    if (!templateMap) return null;
    const layoutId = templateMap[slot];
    if (!layoutId || typeof layoutId !== "string") return null;
    return getLayoutById(layoutId);
  }

  return null;
}

function getLayoutById(id: string): LayoutDefinition | null {
  const normalized = id.trim().toLowerCase();
  const def = layouts[normalized] ?? layouts[id];
  return def && typeof def === "object" ? def : null;
}

/** All layout-2 layout ids (for dropdowns). */
export function getLayout2Ids(): string[] {
  return Object.keys(layouts);
}

/** Reserved key in template map for a single default layout (no role). Role→layout entries remain for suggestions/dev tooling only. */
const DEFAULT_LAYOUT_KEY = "defaultLayout";

/**
 * Default layout-2 id for a section when no override and no explicit node.layout.
 * Template-only: does not use role. Use profile.defaultSectionLayoutId or explicit section.layout for control.
 */
export function getDefaultSectionLayoutId(templateId: string | undefined): string {
  if (templateId && templates[templateId]) {
    const defaultId = templates[templateId][DEFAULT_LAYOUT_KEY];
    if (typeof defaultId === "string" && defaultId.trim()) return defaultId.trim();
  }
  return "content-narrow";
}

export default resolveLayout;
