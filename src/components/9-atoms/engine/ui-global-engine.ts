// src/components/9-atoms/engine/ui-global-engine.ts
import SliderDefs from "@/ui/definitions/ui-scale-ranges.json";
import GoogleTheme from "@/ui/global-styles/google.json";

// Convert 0–1 → min→max scale
export function uiScale(scale: number, min: number, max: number) {
  return min + (max - min) * scale;
}

// Get a UI property (fontSize, radius, padding, etc.)
export function getUIValue(kind: string, prop: string, scale: number) {
  const def = SliderDefs[kind]?.[prop];
  if (!def) return null;
  return uiScale(scale, def.min, def.max);
}

// Pull a theme-level preset (optional)
export function getThemePreset(prop: string) {
  return GoogleTheme[prop];
}
