// src/engine/core/palette-resolve-token.ts
import { getPalette } from "@/engine/core/palette-store";


export function resolveToken(path?: any) {
  if (typeof path !== "string") return path;
  const palette = getPalette();
  return path
    .split(".")
    .reduce((acc, key) => acc?.[key], palette) ?? path;
}
