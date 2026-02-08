// src/engine/core/palette-resolve-token.ts
import { getPalette } from "@/engine/core/palette-store";

const MAX_RESOLVE_DEPTH = 5;

function looksLikeTokenPath(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    /^[\w.]+$/.test(value) &&
    !value.includes(" ")
  );
}

export function resolveToken(path?: any, depth = 0): any {
  if (depth >= MAX_RESOLVE_DEPTH) return path;
  if (typeof path !== "string") return path;
  const palette = getPalette();
  const result = path
    .split(".")
    .reduce((acc: any, key: string) => acc?.[key], palette) ?? path;
  if (looksLikeTokenPath(result)) {
    return resolveToken(result, depth + 1);
  }
  return result;
}
