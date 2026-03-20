/**
 * Safe JSON screen loader.
 * Legacy folder-scanning is disabled.
 * Strict-router runtime should load via API resolvers instead.
 */
const contextKeys: string[] = [];

/**
 * Load a screen JSON by logical screen path.
 * @param relativePath - e.g. "Onboarding/trial.json", "behavior-tests/A-to-D-Test.json", "hiclarify/me_home.json"
 * @returns Parsed JSON node or null if file is missing
 */
export function loadScreenJson(relativePath: string): unknown | null {
  if (typeof console !== "undefined" && console.warn) {
    console.warn(`[safe-json-loader] Legacy loader disabled under strict router: ${relativePath}`);
  }
  return null;
}

/**
 * Returns discoverable JSON paths for this loader.
 */
export function getJsonAppPaths(): string[] {
  return contextKeys.slice();
}

/**
 * Returns all JSON app configs keyed by path.
 */
export function getJsonAppConfigs(): Record<string, unknown> {
  return {};
}
