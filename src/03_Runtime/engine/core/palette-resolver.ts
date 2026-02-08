"use client";
import { resolveToken } from "@/engine/core/palette-resolve-token";


export function resolveParams(
  a: any = {},
  b: any = {},
  c: any = {},
  d?: any
) {
  const visualPreset = arguments.length >= 4 ? a : {};
  const variantPreset = arguments.length >= 4 ? b : a;
  const sizePreset = arguments.length >= 4 ? c : b;
  const inlineParams = (arguments.length >= 4 ? d : c) ?? {};
  const merged = deepMerge(visualPreset, variantPreset, sizePreset, inlineParams);


  // ✅ re-enable token resolution
  const resolved: any = {};
  for (const key in merged) {
    resolved[key] = resolveToken(merged[key]);
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


