/**
 * Blocks runtime config — safety switch for blocks-first resolution.
 *
 * When true: registry and styler resolve atoms/compounds from blocks (manifest + adapters) first.
 * When false: original system only (direct imports / definition files).
 *
 * No file moves or deletions; fallback paths remain intact.
 */

export const USE_BLOCKS_AS_PRIMARY = true;
