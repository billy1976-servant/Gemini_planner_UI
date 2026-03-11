/**
 * In-memory node order overrides per screen path. Dev only; no persistence.
 * Keys MUST be the canonical screen key from getCanonicalScreenKey(searchParams).
 */

type Listener = () => void;

const overridesByPath: Record<string, string[]> = {};
const listeners = new Set<Listener>();

/** Keys that must not be used (old fallbacks); use getCanonicalScreenKey(searchParams) instead. */
const FORBIDDEN_FALLBACK_KEYS = ["container-creations-landing"];

function warnIfNonCanonicalKey(screenPath: string, op: "get" | "set"): void {
  if (FORBIDDEN_FALLBACK_KEYS.includes(screenPath) && typeof console !== "undefined" && console.warn) {
    console.warn(
      `[node-order-override] ${op} called with non-canonical key "${screenPath}". Use getCanonicalScreenKey(searchParams) from @/07_Dev_Tools/navigation/getDevScreenKey.`
    );
  }
}

export function getOverride(screenPath: string): string[] | undefined {
  warnIfNonCanonicalKey(screenPath, "get");
  return overridesByPath[screenPath];
}

export function setOverride(screenPath: string, order: string[]): void {
  if (!screenPath) return;
  warnIfNonCanonicalKey(screenPath, "set");
  overridesByPath[screenPath] = [...order];
  listeners.forEach((fn) => fn());
}

export function clearOverride(screenPath: string): void {
  if (!screenPath) return;
  delete overridesByPath[screenPath];
  listeners.forEach((fn) => fn());
}

export function subscribe(callback: Listener): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}
