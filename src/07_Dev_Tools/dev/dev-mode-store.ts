/**
 * Dev Mode Store — Toggle between Dev (sidebars, phone frame) and User (normal responsive, no chrome).
 * Persisted via URL ?mode=dev|user and localStorage. SSR-safe: no window/document at module scope.
 */

export type DevMode = "dev" | "user";

let currentMode: DevMode = "dev";
const listeners = new Set<() => void>();

export function getDevMode(): DevMode {
  return currentMode;
}

export function setDevMode(mode: DevMode): void {
  if (currentMode === mode) return;
  currentMode = mode;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("devMode", mode);
    } catch {
      /* ignore */
    }
  }
  listeners.forEach((fn) => fn());
}

export function subscribeDevMode(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}
