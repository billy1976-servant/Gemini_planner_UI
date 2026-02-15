"use client";

import React, { createContext, useContext, useSyncExternalStore } from "react";
import type { EffectiveCapabilityProfile } from "./capability.types";
import {
  getCapabilityProfile,
  subscribeCapabilityProfile,
} from "./capability-store";

const CapabilityContext = createContext<EffectiveCapabilityProfile | null>(null);

/**
 * Provider that supplies current effective capability profile from the store.
 * Wrap at same level as effectiveProfile (e.g. page or ExperienceRenderer parent).
 */
export function CapabilityProvider({ children }: { children: React.ReactNode }) {
  const profile = useSyncExternalStore(
    subscribeCapabilityProfile,
    getCapabilityProfile,
    getCapabilityProfile
  );
  return (
    <CapabilityContext.Provider value={profile}>
      {children}
    </CapabilityContext.Provider>
  );
}

/**
 * Hook to read the current capability profile.
 * Returns null if used outside CapabilityProvider (fallback to store directly if needed).
 */
export function useCapabilityProfile(): EffectiveCapabilityProfile | null {
  return useContext(CapabilityContext);
}

/**
 * Hook to read a single domain level.
 */
export function useCapability(domain: keyof EffectiveCapabilityProfile): string | Record<string, unknown> {
  const profile = useCapabilityProfile();
  if (!profile) return "off";
  const v = profile[domain];
  if (typeof v === "string") return v;
  if (v != null && typeof v === "object") return v as Record<string, unknown>;
  return "off";
}
