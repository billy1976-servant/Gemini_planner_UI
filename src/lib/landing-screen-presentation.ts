/**
 * Optional per-screen presentation for JSON-driven landing wizards.
 * Does not affect which content blocks render — only spacing and visual weight (CSS).
 */

export type LandingVisualTone = "default" | "soft" | "bold";

export type LandingScreenDensity = "comfortable" | "compact";

export function landingScreenPresentationAttrs(screen: {
  visualTone?: LandingVisualTone;
  density?: LandingScreenDensity;
}): {
  "data-visual-tone": LandingVisualTone;
  "data-density": LandingScreenDensity;
} {
  return {
    "data-visual-tone": screen.visualTone ?? "default",
    "data-density": screen.density ?? "comfortable",
  };
}
