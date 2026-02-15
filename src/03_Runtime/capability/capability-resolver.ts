/**
 * Capability Resolver — Pure merge only.
 * Precedence: Screen > Template > Global. Level B expands level into sub-controls (optional).
 * No engine calls; no permission logic. Consumers decide behavior from effective profile.
 */

import type {
  CapabilityDomain,
  CapabilityOverrides,
  EffectiveCapabilityProfile,
  GlobalCapabilities,
  ResolveCapabilityProfileOptions,
} from "./capability.types";

const ALL_DOMAINS: CapabilityDomain[] = [
  "auth",
  "identity",
  "messaging",
  "sharing",
  "voice",
  "camera",
  "media",
  "contacts",
  "notifications",
  "sensors",
  "environment",
  "export",
  "presence",
  "device",
  "timeline",
];

/**
 * Resolve effective capability profile from global + template + screen.
 * 1. Start with copy of global (Level A).
 * 2. Override by template capabilities (Level C) for each key present.
 * 3. Override by screen capabilities (Level C) for each key present.
 * 4. (Optional) Expand each domain with Level B sub-controls by level.
 * Returns one object with every domain key set.
 */
export function resolveCapabilityProfile(
  options: ResolveCapabilityProfileOptions
): EffectiveCapabilityProfile {
  const {
    global,
    domainMicroLoaders,
    templateProfile,
    screenCapabilities,
  } = options;

  // 1. Start with global
  const base: Record<string, unknown> = {};
  for (const d of ALL_DOMAINS) {
    base[d] = global[d] ?? "off";
  }

  // 2. Override by template
  const templateCaps = templateProfile?.capabilities;
  if (templateCaps && typeof templateCaps === "object") {
    for (const key of Object.keys(templateCaps)) {
      if (ALL_DOMAINS.includes(key as CapabilityDomain) && templateCaps[key as CapabilityDomain] != null) {
        base[key] = templateCaps[key as CapabilityDomain];
      }
    }
  }

  // 3. Override by screen
  if (screenCapabilities && typeof screenCapabilities === "object") {
    for (const key of Object.keys(screenCapabilities)) {
      if (ALL_DOMAINS.includes(key as CapabilityDomain) && screenCapabilities[key as CapabilityDomain] != null) {
        base[key] = screenCapabilities[key as CapabilityDomain];
      }
    }
  }

  // 4. Level B expansion (optional): merge sub-controls per domain
  if (domainMicroLoaders && typeof domainMicroLoaders === "object") {
    for (const domain of ALL_DOMAINS) {
      const loader = domainMicroLoaders[domain];
      if (typeof loader !== "function") continue;
      try {
        const micro = loader();
        if (micro && typeof micro === "object") {
          const level = base[domain] as string;
          // If micro has a key matching level (e.g. "lite", "full"), use that set; else merge whole micro under domain
          const expanded =
            level && typeof level === "string" && micro[level] != null
              ? { level, ...(typeof micro[level] === "object" && micro[level] !== null ? (micro[level] as Record<string, unknown>) : {}), ...micro }
              : { ...micro };
          base[domain] = expanded;
        }
      } catch {
        // Keep base[domain] as-is on loader error
      }
    }
  }

  return base as EffectiveCapabilityProfile;
}

/**
 * Get default global capabilities (all off / safe defaults).
 * Used when no global JSON is loaded.
 */
export function getDefaultGlobalCapabilities(): GlobalCapabilities {
  const out = {} as GlobalCapabilities;
  for (const d of ALL_DOMAINS) {
    out[d] = "off";
  }
  out.voice = "keyboard-native";
  out.export = "basic";
  out.device = "lite";
  return out;
}
