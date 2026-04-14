const TRUTHY = new Set(["1", "true", "yes", "on"]);
const RUNTIME_MODES = new Set(["builder", "presenter", "walkthrough"] as const);
export type LandingRuntimeMode = "builder" | "presenter" | "walkthrough";

function isTruthyToken(v: string): boolean {
  return TRUTHY.has(v.trim().toLowerCase());
}

/** Server `searchParams.slideBuilder` (string or string[] from Next). */
export function parseSlideBuilderFlag(raw: string | string[] | undefined): boolean {
  if (raw === undefined) return false;
  const v = Array.isArray(raw) ? raw[0] : raw;
  return typeof v === "string" && isTruthyToken(v);
}

/** Client `useSearchParams().get("slideBuilder")`. */
export function slideBuilderFromUrlParam(value: string | null): boolean {
  if (value == null || value === "") return false;
  return isTruthyToken(value);
}

/**
 * `/landing-2` server page: slide builder (outline + preview + inspector) is on when the param is omitted.
 * Opt out with `?slideBuilder=0`, `false`, `no`, or `off`.
 */
export function parseSlideBuilderFlagDefaultOn(
  raw: string | string[] | undefined
): boolean {
  if (raw === undefined) return true;
  return parseSlideBuilderFlag(raw);
}

function parseRuntimeModeToken(v: string): LandingRuntimeMode | null {
  const normalized = v.trim().toLowerCase();
  if (RUNTIME_MODES.has(normalized as LandingRuntimeMode)) {
    return normalized as LandingRuntimeMode;
  }
  return null;
}

/** Server `searchParams.runtimeMode` (string or string[] from Next). */
export function parseLandingRuntimeMode(
  raw: string | string[] | undefined
): LandingRuntimeMode | null {
  if (raw === undefined) return null;
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (typeof v !== "string" || v.length === 0) return null;
  return parseRuntimeModeToken(v);
}

/** Client `useSearchParams().get("runtimeMode")`. */
export function runtimeModeFromUrlParam(
  value: string | null
): LandingRuntimeMode | null {
  if (value == null || value === "") return null;
  return parseRuntimeModeToken(value);
}
