/**
 * Dev-only capability readout.
 * Logs current effective capability profile; exposes on window for console/overlay.
 * No UI redesign; console + optional data attribute or window getter.
 */

import { getCapabilityProfile } from "./capability-store";

const DEV = typeof process !== "undefined" && process.env?.NODE_ENV === "development";

/**
 * Log current resolved capability profile to console (dev only).
 */
export function logCapabilityProfile(): void {
  if (!DEV) return;
  const profile = getCapabilityProfile();
  console.log("[Capability Hub] Effective profile:", profile);
}

/**
 * Return current profile for dev overlay or inspection.
 */
export function getCapabilityProfileForDebug(): Record<string, unknown> {
  const profile = getCapabilityProfile();
  return { ...profile } as Record<string, unknown>;
}

/**
 * Install dev readout: expose on window and log on demand.
 * Call from layout or dev panel once.
 */
export function installCapabilityDebug(): void {
  if (!DEV || typeof window === "undefined") return;
  (window as unknown as { __capabilityProfile?: () => Record<string, unknown> }).__capabilityProfile = getCapabilityProfileForDebug;
  (window as unknown as { __logCapabilityProfile?: () => void }).__logCapabilityProfile = logCapabilityProfile;
}
