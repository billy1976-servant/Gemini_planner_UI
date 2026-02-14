/**
 * Spacing scale resolver — template-driven vertical rhythm.
 * Returns param overlay for Section (and optionally Card) by scale id.
 * Single source: lib/layout/spacing-scales.json
 *
 * Note: Section vertical spacing is engine-only. section.layout.gap from this scale
 * is stripped in json-renderer before merge; only layout-definitions + resolveSectionSpacing control section gap/padding.
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
 * For Section: section.layout.gap is stripped by renderer (engine-only vertical spacing). Other keys may merge.
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
