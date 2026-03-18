/**
 * Onboarding Editor Store — LOCAL toggle for Container Creations onboarding screen only.
 * When true: 3-up editor / step cards. When false: single step-by-step user preview.
 * Persisted in localStorage (client-safe). SSR-safe: no window/document at module scope.
 */

let enabled = true;
let hasHydrated = false;
const listeners = new Set<() => void>();

export function getOnboardingEditorEnabled(): boolean {
  if (typeof window !== "undefined" && !hasHydrated) {
    hasHydrated = true;
    try {
      const v = window.localStorage.getItem("onboardingEditorEnabled");
      if (v !== null) enabled = v === "true";
    } catch {
      /* keep default */
    }
  }
  return enabled;
}

export function setOnboardingEditorEnabled(value: boolean): void {
  if (enabled === value) return;
  enabled = value;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem("onboardingEditorEnabled", String(value));
    } catch {
      /* ignore */
    }
  }
  listeners.forEach((fn) => fn());
}

export function subscribeOnboardingEditorEnabled(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}
