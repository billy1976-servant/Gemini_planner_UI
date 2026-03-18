/**
 * Editor Mode Store — Universal Editor vs Preview for any editor-capable screen.
 * Persisted in localStorage (client-safe). SSR-safe: no window/document at module scope.
 */

export type EditorMode = "editor" | "preview";

let mode: EditorMode = "preview";
let hasHydrated = false;
const listeners = new Set<() => void>();

export function getEditorMode(): EditorMode {
  if (typeof window !== "undefined" && !hasHydrated) {
    hasHydrated = true;
    try {
      const v = window.localStorage.getItem("editorMode");
      if (v === "editor" || v === "preview") mode = v;
    } catch {
      /* keep default */
    }
  }
  return mode;
}

export function setEditorMode(value: EditorMode): void {
  if (mode === value) return;
  mode = value;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem("editorMode", value);
    } catch {
      /* ignore */
    }
  }
  listeners.forEach((fn) => fn());
}

export function subscribeEditorMode(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}
