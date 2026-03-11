/**
 * Raw dev screen key from URL (?screen=). Returns null when param is missing.
 * Prefer getCanonicalScreenKey for all override/registration flows.
 */
export function getDevScreenKey(
  searchParams: URLSearchParams | ReadonlyURLSearchParams | { get: (k: string) => string | null }
): string | null {
  return searchParams.get("screen") ?? null;
}

/**
 * Canonical screen key for the entire repo. Use this for overrides, node order,
 * registerJsonScreen, DevNodePanel, and any dev panel that reads/writes by screen.
 * NO fallbacks — returns null when ?screen= is absent. Callers must delay
 * registration or skip read/write when null.
 */
export function getCanonicalScreenKey(
  searchParams: URLSearchParams | ReadonlyURLSearchParams | { get: (k: string) => string | null }
): string | null {
  return getDevScreenKey(searchParams);
}
