/**
 * @deprecated LEGACY — Not on main app path. Single content entrypoint is
 * @/logic/content/content-resolver (resolveContent). Zero runtime imports.
 * Stub only; remove when safe.
 *
 * content/*.content.json (text, media, data) were consumed only by this legacy
 * resolver; logic/content/content-resolver uses its own sources. Keep or remove
 * those JSON files per project needs.
 */
export function resolveContent(_kind: string, _key: string, _valueOverride: unknown = null): unknown {
  throw new Error(
    "content/content-resolver is deprecated; use @/logic/content/content-resolver resolveContent(key) instead."
  );
}
