/**
 * Component layout resolver (internal arrangement for sections, molecules, cards).
 * Resolves a layout id to moleculeLayout-shaped definition (type, preset, params).
 * Used by Section (via LayoutMoleculeRenderer), and by molecules that use the same flow.
 */

import componentLayoutsData from "./component-layouts.json";

export type ComponentLayoutDefinition = {
  type: "column" | "row" | "grid" | "stacked";
  preset?: string | null;
  params?: Record<string, unknown>;
};

type ComponentLayoutsMap = Record<string, ComponentLayoutDefinition>;

const componentLayouts = componentLayoutsData as ComponentLayoutsMap;

/**
 * Resolve a component layout by id (e.g. section layout id used for inner arrangement).
 * Returns moleculeLayout-shaped definition or null if not found.
 */
export function resolveComponentLayout(layoutId: string | null | undefined): ComponentLayoutDefinition | null {
  if (layoutId == null || typeof layoutId !== "string") return null;
  const id = layoutId.trim();
  if (!id) return null;
  const normalized = id.toLowerCase();
  const def = componentLayouts[normalized] ?? componentLayouts[id];
  return def && typeof def === "object" ? def : null;
}

/** All component layout ids that have section-inner definitions (for dropdowns / validation). */
export function getComponentLayoutIds(): string[] {
  return Object.keys(componentLayouts);
}

export default resolveComponentLayout;
