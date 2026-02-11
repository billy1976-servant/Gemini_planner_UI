"use client";
import { resolveToken } from "@/engine/core/palette-resolve-token";
import { palettes } from "@/palettes";
import defaultPalette from "@/palettes/default.json";

/**
 * Optional palette override: when rendering a palette preview tile, pass the palette name
 * so token resolution uses that palette instead of the global store.
 */
function getPaletteForResolution(paletteName?: string): Record<string, any> | undefined {
  if (!paletteName || typeof paletteName !== "string") return undefined;
  const p = (palettes as Record<string, any>)[paletteName];
  return p ? (p as Record<string, any>) : (defaultPalette as Record<string, any>);
}

export function resolveParams(
  a: any = {},
  b: any = {},
  c: any = {},
  d?: any,
  paletteOverrideName?: string
) {
  const visualPreset = arguments.length >= 4 ? a : {};
  const variantPreset = arguments.length >= 4 ? b : a;
  const sizePreset = arguments.length >= 4 ? c : b;
  const inlineParams = (arguments.length >= 4 ? d : c) ?? {};
  const merged = deepMerge(visualPreset, variantPreset, sizePreset, inlineParams);
  const paletteOverride = getPaletteForResolution(paletteOverrideName);

  const resolved: any = {};
  for (const key in merged) {
    resolved[key] = resolveToken(merged[key], 0, paletteOverride);
  }

  return resolved;
}


function deepMerge(...objects: any[]) {
  const result: any = {};
  for (const obj of objects) {
    if (!obj || typeof obj !== "object") continue;
    for (const key in obj) {
      const value = obj[key];
      if (value && typeof value === "object" && !Array.isArray(value)) {
        result[key] = deepMerge(result[key] || {}, value);
      } else {
        result[key] = value;
      }
    }
  }
  return result;
}


