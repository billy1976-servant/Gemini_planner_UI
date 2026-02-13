/**
 * Palette token inspection utility — read-only.
 * Wraps existing resolveToken; builds trace and optional DOM probe spec.
 * No engine changes.
 */

import { resolveToken } from "@/engine/core/palette-resolve-token";

export type TraceStep = {
  step: string;
  input: unknown;
  output: unknown;
  ok: boolean;
  note?: string;
};

export type TokenProbeResult = {
  key: string;
  expected: unknown;
  resolved: unknown;
  computed?: Record<string, string>;
  pass: boolean;
  failReason?: string;
  trace: TraceStep[];
};

function looksLikeTokenPath(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    /^[\w.]+$/.test(value) &&
    !value.includes(" ")
  );
}

function isPrimitive(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  const t = typeof value;
  return t === "string" || t === "number" || t === "boolean";
}

function readPalettePath(keyPath: string, palette: Record<string, any> | null | undefined): unknown {
  if (!palette || typeof palette !== "object") return undefined;
  return keyPath.split(".").reduce((acc: any, key: string) => acc?.[key], palette);
}

export type InspectPaletteTokenArgs = {
  keyPath: string;
  palette: Record<string, any> | null | undefined;
  /** Use existing resolver; default is resolveToken from palette-resolve-token */
  resolve?: (path: string, paletteOverride: Record<string, any>) => unknown;
  probeSpec?: Record<string, string | string[]>;
};

const DEFAULT_PROBE_SPEC: Record<string, string | string[]> = {
  textWeight: "fontWeight",
  textSize: "fontSize",
  fontFamily: "fontFamily",
  lineHeight: "lineHeight",
  letterSpacing: "letterSpacing",
  radius: "borderRadius",
  shadow: "boxShadow",
  color: "color",
  surface: "backgroundColor",
  padding: "padding",
  gap: "gap",
  elevation: "boxShadow",
};

function getProbeCssProperty(keyPath: string, probeSpec: Record<string, string | string[]>): string[] {
  const family = keyPath.split(".")[0];
  const spec = probeSpec[family] ?? DEFAULT_PROBE_SPEC[family];
  if (!spec) return [];
  return Array.isArray(spec) ? spec : [spec];
}

/**
 * Inspect a single palette token: build trace and pass/fail.
 * Uses existing resolveToken for "resolve refs" step.
 */
export function inspectPaletteToken(args: InspectPaletteTokenArgs): TokenProbeResult {
  const { keyPath, palette, resolve = (path, pal) => resolveToken(path, 0, pal), probeSpec = DEFAULT_PROBE_SPEC } = args;

  const trace: TraceStep[] = [];
  const raw = readPalettePath(keyPath, palette);

  trace.push({
    step: "read palette path",
    input: keyPath,
    output: raw,
    ok: raw !== undefined,
    note: raw === undefined ? "Key missing on palette" : undefined,
  });

  const resolved = typeof keyPath === "string" && palette ? resolve(keyPath, palette) : raw;
  const resolveOk = isPrimitive(resolved);

  trace.push({
    step: "resolve refs",
    input: raw,
    output: resolved,
    ok: resolveOk,
    note: !resolveOk && resolved !== undefined && resolved !== null
      ? "Resolver returned non-primitive; check palette token mapping for this family or missing flattening of nested roles (textRole/surfaceTier/prominence)."
      : undefined,
  });

  trace.push({
    step: "final normalize",
    input: resolved,
    output: resolved,
    ok: isPrimitive(resolved),
  });

  const pass = isPrimitive(resolved);
  const failReason = pass
    ? undefined
    : resolved === undefined || resolved === null
      ? "Missing or null"
      : "Resolver returned non-primitive";

  return {
    key: keyPath,
    expected: raw,
    resolved,
    pass,
    failReason,
    trace,
  };
}

/**
 * Return CSS property names to probe for a token family (for TokenProbeHost).
 */
export function getProbeSpecForToken(keyPath: string, customSpec?: Record<string, string | string[]>): string[] {
  const spec = customSpec ?? DEFAULT_PROBE_SPEC;
  return getProbeCssProperty(keyPath, spec);
}
