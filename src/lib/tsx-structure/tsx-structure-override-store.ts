/**
 * Dev-only in-memory overrides for TSX structure (structureType, templateId, overrides) per screenPath.
 * Used by the right-sidebar TSX panel to change the active screen's structure live.
 * Not persisted; control surface only.
 */

import type { ScreenMetadata } from "./types";

type Listener = () => void;

let overridesByPath: Record<string, ScreenMetadata> = {};
const listeners = new Set<Listener>();

export function getTsxStructureOverride(screenPath: string): ScreenMetadata | undefined {
  return overridesByPath[screenPath];
}

export function setTsxStructureOverride(screenPath: string, metadata: ScreenMetadata | null): void {
  if (!screenPath) return;
  // eslint-disable-next-line no-console -- diagnostic: confirm panel writes overrides
  console.log("TSX OVERRIDE SET", screenPath, metadata);
  if (metadata == null) {
    delete overridesByPath[screenPath];
  } else {
    overridesByPath[screenPath] = metadata;
  }
  listeners.forEach((fn) => fn());
}

export function subscribeTsxStructureOverride(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
