// src/engine/core/palette-resolve-token.ts
import { getPalette } from "@/engine/core/palette-store";
import { isEnabled, recordStep } from "@/diagnostics/traceStore";

const MAX_RESOLVE_DEPTH = 5;

function looksLikeTokenPath(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    /^[\w.]+$/.test(value) &&
    !value.includes(" ")
  );
}

/**
 * Resolve a token path (e.g. "color.primary") to a value from a palette.
 * @param path - Token path or any value (non-strings returned as-is).
 * @param depth - Recursion depth (internal).
 * @param paletteOverride - When provided, use this palette instead of the global store (e.g. for palette preview tiles).
 */
export function resolveToken(path?: any, depth = 0, paletteOverride?: Record<string, any>): any {
  if (depth >= MAX_RESOLVE_DEPTH) return path;
  if (typeof path !== "string") return path;
  // Section vertical spacing is engine-only; template/preset spacing is intentionally ignored. Palette spacing/gap/padding tokens return 0.
  if (path.startsWith("spacing.") || path.startsWith("gap.") || path.startsWith("padding.")) {
    return "0";
  }
  const palette = paletteOverride ?? getPalette();
  const result = path
    .split(".")
    .reduce((acc: any, key: string) => acc?.[key], palette) ?? path;
  if (depth === 0 && isEnabled()) recordStep({ label: "read palette path", in: path, out: result, meta: { paletteOverride: !!paletteOverride } });
  if (looksLikeTokenPath(result)) {
    const resolved = resolveToken(result, depth + 1, paletteOverride);
    if (depth === 0 && isEnabled()) recordStep({ label: "resolve refs", in: result, out: resolved });
    if (depth === 0 && (path.includes("textRole") || path.includes("color"))) {
      console.log("TOKEN_RESOLVE", { token: path, palette, value: resolved });
    }
    return resolved;
  }
  if (depth === 0 && isEnabled()) recordStep({ label: "resolve refs", in: result, out: result });
  if (depth === 0 && (path.includes("textRole") || path.includes("color"))) {
    console.log("TOKEN_RESOLVE", { token: path, palette, value: result });
  }
  return result;
}
