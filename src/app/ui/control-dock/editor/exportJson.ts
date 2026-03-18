"use client";

/**
 * Serialize config to pretty-printed JSON.
 * Use for future export/copy (no UI yet).
 */
export function exportJson(config: unknown): string {
  return JSON.stringify(config, null, 2);
}
