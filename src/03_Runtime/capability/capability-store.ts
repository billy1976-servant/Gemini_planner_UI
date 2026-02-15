/**
 * Capability Store — Single effective profile; write from resolver only.
 * Read by behaviors, adapter, optional UI. No writes from engines or UI.
 */

import type { EffectiveCapabilityProfile, CapabilityDomain } from "./capability.types";
import { getDefaultGlobalCapabilities } from "./capability-resolver";

type Listener = () => void;

let currentProfile: EffectiveCapabilityProfile = buildDefaultProfile();
const listeners = new Set<Listener>();

function buildDefaultProfile(): EffectiveCapabilityProfile {
  const global = getDefaultGlobalCapabilities();
  const out = {} as EffectiveCapabilityProfile;
  for (const k of Object.keys(global)) {
    out[k as CapabilityDomain] = global[k as CapabilityDomain];
  }
  return out;
}

/**
 * Write effective capability profile (only from resolver / page).
 * Notifies all subscribers.
 */
export function setCapabilityProfile(profile: EffectiveCapabilityProfile): void {
  currentProfile = { ...profile };
  listeners.forEach((l) => l());
}

/**
 * Read full effective capability profile.
 */
export function getCapabilityProfile(): EffectiveCapabilityProfile {
  return currentProfile;
}

/**
 * Read single domain level (string or object).
 */
export function getCapabilityLevel(domain: CapabilityDomain): string | Record<string, unknown> {
  const v = currentProfile[domain];
  if (typeof v === "string") return v;
  if (v != null && typeof v === "object") return v as Record<string, unknown>;
  return "off";
}

/**
 * Check if a domain is effectively "on" (not off).
 * For string: "off" => false; anything else => true.
 * For object: presence of level "off" or explicit off => false.
 */
export function isCapabilityOn(domain: CapabilityDomain): boolean {
  const level = getCapabilityLevel(domain);
  if (typeof level === "string") return level !== "off";
  if (level && typeof level === "object" && level.level === "off") return false;
  return true;
}

/**
 * Subscribe to profile changes (e.g. screen/template change).
 * Returns unsubscribe function.
 */
export function subscribeCapabilityProfile(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
