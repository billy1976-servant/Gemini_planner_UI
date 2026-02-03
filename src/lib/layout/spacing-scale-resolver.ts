/**
 * Spacing scale resolver — template-driven vertical rhythm.
 * Returns param overrides for Section (and optionally Card) by scale id.
 */
import defaultScale from "./spacing-scales/default.json";
import luxuryScale from "./spacing-scales/luxury.json";
import saasScale from "./spacing-scales/saas.json";
import magazineScale from "./spacing-scales/magazine.json";
import courseScale from "./spacing-scales/course.json";

const SCALES: Record<string, Record<string, any>> = {
  default: defaultScale as Record<string, any>,
  luxury: luxuryScale as Record<string, any>,
  saas: saasScale as Record<string, any>,
  magazine: magazineScale as Record<string, any>,
  course: courseScale as Record<string, any>,
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
