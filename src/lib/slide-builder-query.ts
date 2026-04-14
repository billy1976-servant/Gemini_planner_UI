const TRUTHY = new Set(["1", "true", "yes", "on"]);

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
