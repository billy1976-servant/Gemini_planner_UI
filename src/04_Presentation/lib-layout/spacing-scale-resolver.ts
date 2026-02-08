/**
 * Spacing scale resolver — template-driven vertical rhythm.
 * Returns param overrides for Section (and optionally Card) by scale id.
 * Single source: lib/layout/spacing-scales.json
 */
import scalesBundle from "./spacing-scales.json";

const SCALES: Record<string, Record<string, any>> = {
  default: scalesBundle.default as Record<string, any>,
  luxury: scalesBundle.luxury as Record<string, any>,
  saas: scalesBundle.saas as Record<string, any>,
  magazine: scalesBundle.magazine as Record<string, any>,
  course: scalesBundle.course as Record<string, any>,
};

export type SpacingScaleId = keyof typeof SCALES;

/**
 * Returns param overlay for a molecule type given a spacing scale id.
 * Use for Section: merge into params (surface.padding, moleculeLayout.params.gap).
 */
export function getSpacingForScale(
  scaleId: string | undefined | null,
  moleculeType: "section" | "card" = "section"
): Record<string, any> {
  if (!scaleId) return {};
  const scale = SCALES[scaleId] ?? SCALES.default;
  const block = scale[moleculeType];
  if (!block) return {};
  return block;
}
