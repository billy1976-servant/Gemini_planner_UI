/**
 * Capability Hub — Single module for resolver + store.
 * No integration with page or behavior here; that is Phase 2/3.
 */

import globalCapabilitiesJson from "./global-capabilities.json";
import type { GlobalCapabilities, EffectiveCapabilityProfile, CapabilityDomain } from "./capability.types";

export type { EffectiveCapabilityProfile, GlobalCapabilities, CapabilityDomain, CapabilityOverrides, ResolveCapabilityProfileOptions } from "./capability.types";
export { resolveCapabilityProfile, getDefaultGlobalCapabilities } from "./capability-resolver";
export { getDomainMicroLoaders } from "./capability-domain-loaders";
export { logCapabilityProfile, getCapabilityProfileForDebug, installCapabilityDebug } from "./capability-debug";
export {
  getCapabilityProfile,
  getCapabilityLevel,
  isCapabilityOn,
  setCapabilityProfile,
  subscribeCapabilityProfile,
} from "./capability-store";
export { CapabilityProvider, useCapabilityProfile, useCapability } from "./CapabilityContext";

/** Load Level A global capabilities from bundled JSON. */
export function loadGlobalCapabilities(): GlobalCapabilities {
  const raw = globalCapabilitiesJson as Record<string, string>;
  const out: GlobalCapabilities = {} as GlobalCapabilities;
  const domains: CapabilityDomain[] = [
    "auth", "identity", "messaging", "sharing", "voice", "camera", "media",
    "contacts", "notifications", "sensors", "environment", "export", "presence", "device", "timeline",
  ];
  for (const d of domains) {
    out[d] = raw[d] ?? "off";
  }
  return out;
}
