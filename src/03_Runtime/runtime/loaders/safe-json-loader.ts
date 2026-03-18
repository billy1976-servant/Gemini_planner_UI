/**
 * Safe JSON screen loader — prevents build/runtime crash when a screen file is deleted.
 * Uses require.context so only existing files are bundled; missing paths return null.
 * Path resolves to src/01_App/(dead) Json/apps (alias: apps-json/apps).
 */

// Relative path from src/03_Runtime/runtime/loaders/ → src/01_App/(dead) Json/apps (alias: apps-json/apps).
// String literal required so webpack can statically extract context dependencies at build time.
const context = (require as any).context(
  "../../../01_App/(dead) Json/apps",
  true,
  /\.json$/
);

const contextKeys = context.keys();

/**
 * Load a screen JSON by path relative to apps-json/apps.
 * @param relativePath - e.g. "Onboarding/trial.json", "behavior-tests/A-to-D-Test.json", "hiclarify/me_home.json"
 * @returns Parsed JSON node or null if file is missing
 */
export function loadScreenJson(relativePath: string): unknown | null {
  const key = relativePath.startsWith("./") ? relativePath : `./${relativePath}`;
  if (!contextKeys.includes(key)) {
    if (typeof console !== "undefined" && console.warn) {
      console.warn(`[safe-json-loader] Screen file not found (ignored): ${relativePath}`);
    }
    return null;
  }
  try {
    const mod = context(key);
    return mod?.default ?? mod;
  } catch {
    if (typeof console !== "undefined" && console.warn) {
      console.warn(`[safe-json-loader] Failed to load screen: ${relativePath}`);
    }
    return null;
  }
}

/**
 * Returns all JSON app paths discoverable at build time (keys from require.context).
 * Paths are relative to apps-json/apps, with leading ./ and no normalization.
 */
export function getJsonAppPaths(): string[] {
  return contextKeys.slice();
}

/**
 * Returns all JSON app configs keyed by path (relative to apps-json/apps).
 * Loads every file in the context; use for registry or validation.
 */
export function getJsonAppConfigs(): Record<string, unknown> {
  const configs: Record<string, unknown> = {};
  for (const key of contextKeys) {
    try {
      const mod = context(key);
      const value = mod?.default ?? mod;
      if (value !== undefined) configs[key] = value;
    } catch {
      // skip failed loads
    }
  }
  return configs;
}
