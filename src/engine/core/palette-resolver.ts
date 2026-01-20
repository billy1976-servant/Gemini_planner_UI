"use client";
import { resolveToken } from "@/engine/core/palette-resolve-token";


export function resolveParams(
  variantPreset: any = {},
  sizePreset: any = {},
  inlineParams: any = {}
) {
  const merged = deepMerge(variantPreset, sizePreset, inlineParams);


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


