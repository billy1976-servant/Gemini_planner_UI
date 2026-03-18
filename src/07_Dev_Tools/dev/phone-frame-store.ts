/**
 * Phone Frame Store — UI-only toggle state
 * 
 * STRICT RULES:
 * - NOT stored in JSON
 * - NOT stored in schema
 * - NOT added to screens
 * - Purely a UI preview control
 */

// Try to restore from sessionStorage (survives Fast Refresh)
let phoneFrameEnabled: boolean = false;
if (typeof window !== "undefined") {
  const stored = sessionStorage.getItem("phoneFrameEnabled");
  if (stored !== null) {
    phoneFrameEnabled = stored === "true";
  }
}

const listeners = new Set<() => void>();

export function getPhoneFrameEnabled(): boolean {
  return phoneFrameEnabled;
}

export function setPhoneFrameEnabled(enabled: boolean): void {
  console.log("[phone-frame-store] setPhoneFrameEnabled:", enabled);
  phoneFrameEnabled = enabled;
  if (typeof window !== "undefined") {
    sessionStorage.setItem("phoneFrameEnabled", String(enabled));
  }
  listeners.forEach(fn => fn());
}

export function subscribePhoneFrameEnabled(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}
