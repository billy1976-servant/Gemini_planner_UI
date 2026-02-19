/**
 * In-memory node order overrides per screen path. Dev only; no persistence.
 */

type Listener = () => void;

const overridesByPath: Record<string, string[]> = {};
const listeners = new Set<Listener>();

export function getOverride(screenPath: string): string[] | undefined {
  return overridesByPath[screenPath];
}

export function setOverride(screenPath: string, order: string[]): void {
  if (!screenPath) return;
  overridesByPath[screenPath] = [...order];
  listeners.forEach((fn) => fn());
}

export function clearOverride(screenPath: string): void {
  if (!screenPath) return;
  delete overridesByPath[screenPath];
  listeners.forEach((fn) => fn());
}

export function subscribe(callback: Listener): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}
