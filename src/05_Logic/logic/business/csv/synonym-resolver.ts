/**
 * SynonymResolver — map CSV header names to canonical logical names.
 * Input: normalized header row (string[]).
 * Output: column binding (canonical key → column index).
 */

import type { CanonicalKey } from "./csv-header-synonyms";
import { CSV_HEADER_SYNONYMS, ALL_CANONICAL_KEYS } from "./csv-header-synonyms";

export type ColumnBinding = Map<CanonicalKey, number>;

/**
 * Resolve headers to canonical key → column index.
 * For each canonical key, find the first header that matches any of its synonyms (exact match after normalization).
 * Headers are already lowercased; synonyms are lowercased in config.
 */
export function resolveSynonyms(headers: string[]): ColumnBinding {
  const binding: ColumnBinding = new Map();
  for (const key of ALL_CANONICAL_KEYS) {
    const synonyms = CSV_HEADER_SYNONYMS[key];
    const idx = headers.findIndex((h) => synonyms.includes(h));
    if (idx >= 0) binding.set(key, idx);
  }
  return binding;
}
