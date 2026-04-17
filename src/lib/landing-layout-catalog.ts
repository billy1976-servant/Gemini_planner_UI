/**
 * Single source of truth for Container Creations wizard `screens[].layout` values.
 * Live layout previews use the same string as JSON: `{ ...screen, layout: optionId }`.
 */

export const LANDING_LAYOUT_IDS = [
  "hero",
  "stamped",
  "twoCol",
  "twoColImageLeft",
  "proofPanel",
  "splitProof",
  "textOnly",
] as const;

export type LandingLayoutId = (typeof LANDING_LAYOUT_IDS)[number];

/** Ordered ids for inspectors, pickers, and preview loops. */
export const LANDING_LAYOUT_OPTIONS: readonly string[] = LANDING_LAYOUT_IDS;

/** `<select>` options: canonical list plus current value when it is a custom/legacy layout. */
export function landingLayoutSelectOptions(currentLayout: string | undefined): string[] {
  const v = (currentLayout ?? "").trim();
  if (v && !(LANDING_LAYOUT_IDS as readonly string[]).includes(v)) {
    return [...LANDING_LAYOUT_IDS, v];
  }
  return [...LANDING_LAYOUT_IDS];
}
