/**
 * Safe JSON screen loader — prevents build/runtime crash when a screen file is deleted.
 * Uses require.context so only existing files are bundled; missing paths return null.
 */

// Relative path so require.context resolves at build; only existing JSON files are bundled.
const context = (require as any).context(
  "../../apps-json/apps",
  true,
  /\.json$/
);

const contextKeys = context.keys();

/**
 * Load a screen JSON by path relative to apps-json/apps.
 * @param relativePath - e.g. "Onboarding/trial.json", "behavior-tests/A-to-D-Test.json"
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
