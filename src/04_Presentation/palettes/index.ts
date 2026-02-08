// src/palettes/index.ts


import defaultPalette from "./default.json";
import darkPalette from "./dark.json";
import kidsPalette from "./kids.json";
import playfulPalette from "./playful.json";
import elderlyPalette from "./elderly.json";
import frenchPalette from "./french.json";
import spanishPalette from "./spanish.json";
import premiumPalette from "./premium.json";
import crazyPalette from "./crazy.json";


/**
 * Single registry of all UI palettes
 * Keys here are the ONLY valid palette names
 */
export const palettes = {
  default: defaultPalette,
  dark: darkPalette,
  kids: kidsPalette,
  playful: playfulPalette,
  elderly: elderlyPalette,
  french: frenchPalette,
  spanish: spanishPalette,
  premium: premiumPalette,
  crazy: crazyPalette,
} as const;


/**
 * Palette name union (auto-derived)
 */
export type PaletteName = keyof typeof palettes;


