/**
 * Container Creations — Structural Fit Check resolver.
 * Input: intent, ribHeight, containerLength
 * Output: recommendation ("vent" | "skylight" | "integrated")
 * Used when advancing from Step 3 to Step 4.
 */

export type LandingIntent = "condensation" | "lighting" | "both" | "upgrade" | null;
export type Recommendation = "vent" | "skylight" | "integrated" | null;

export function resolveContainerCreationsFit(
  intent: LandingIntent,
  ribHeight: string | null,
  containerLength: string | null
): Recommendation {
  if (!intent || intent === "upgrade") {
    return null;
  }
  if (intent === "condensation") {
    return "vent";
  }
  if (intent === "lighting") {
    return "skylight";
  }
  if (intent === "both") {
    return "integrated";
  }
  return null;
}
