/**
 * Inspector UI state: inspect mode on/off, hovered element id, pinned element id, token trace view.
 * Synced with traceStore.setEnabled when inspect mode toggles.
 */

import { setEnabled } from "./traceStore";

type Listener = () => void;
const listeners = new Set<Listener>();

let inspectMode = false;
let hoveredId: string | null = null;
let pinnedId: string | null = null;

export type TokenTraceView = { keyPath: string; steps: { label: string; in: unknown; out: unknown }[]; resolved: unknown; pass: boolean };
let tokenTraceView: TokenTraceView | null = null;

export function getInspectMode(): boolean {
  return inspectMode;
}

export function setInspectMode(value: boolean): void {
  if (inspectMode === value) return;
  inspectMode = value;
  setEnabled(value);
  listeners.forEach((l) => l());
}

export function getHoveredId(): string | null {
  return hoveredId;
}

export function setHoveredId(id: string | null): void {
  if (hoveredId === id) return;
  hoveredId = id;
  listeners.forEach((l) => l());
}

export function getPinnedId(): string | null {
  return pinnedId;
}

export function setPinnedId(id: string | null): void {
  if (pinnedId === id) return;
  pinnedId = id;
  listeners.forEach((l) => l());
}

export function getTokenTraceView(): TokenTraceView | null {
  return tokenTraceView;
}

export function setTokenTraceView(view: TokenTraceView | null): void {
  if (tokenTraceView === view) return;
  tokenTraceView = view;
  listeners.forEach((l) => l());
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
