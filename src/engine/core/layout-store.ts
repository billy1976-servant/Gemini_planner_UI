"use client";

import layoutSchema from "@/layout/layout-schema.json";
import type { LayoutExperience, NavPlacement } from "@/layout/layout-engine/region-policy";

/**
 * ======================================================
 * ACTIVE LAYOUT STATE (PLAIN DATA ONLY)
 * ======================================================
 */
let activeLayout: {
  /**
   * Experience selector (Website/App/Learning).
   * This must NOT share a field with layout presets.
   */
  experience: LayoutExperience;
  type: string;
  preset: string | null;
  /**
   * Region policy (layout engine input).
   * Keep as plain JSON.
   */
  regionPolicy: {
    nav: { enabled: boolean; placement: NavPlacement };
    regions: Record<string, { enabled: boolean }>;
  };
} = {
  experience: "website",
  type: "column",
  preset: null,
  regionPolicy: {
    nav: {
      enabled: true,
      placement: (layoutSchema as any)?.navigation?.value ?? "top",
    },
    regions: {
      header: { enabled: (layoutSchema as any)?.regions?.header?.enabled ?? true },
      content: { enabled: (layoutSchema as any)?.regions?.content?.enabled ?? true },
      footer: { enabled: (layoutSchema as any)?.regions?.footer?.enabled ?? true },
    },
  },
};


/**
 * ======================================================
 * SUBSCRIBERS
 * ======================================================
 */
const listeners = new Set<() => void>();


/**
 * ======================================================
 * GET CURRENT LAYOUT
 * Used by JsonRenderer snapshot
 * ======================================================
 */
export function getLayout() {
  return activeLayout;
}

export function getExperience() {
  return activeLayout.experience;
}


/**
 * ======================================================
 * SET LAYOUT
 * Merges partial updates and validates type
 * ======================================================
 */
export function setLayout(next: {
  experience?: LayoutExperience;
  type?: string;
  preset?: string | null;
  regionPolicy?: Partial<{
    nav: Partial<{ enabled: boolean; placement: NavPlacement }>;
    regions: Record<string, Partial<{ enabled: boolean }>>;
  }>;
}) {
  const allowedTypes = new Set(["column", "row", "grid", "stack", "page"]);
  const resolvedType =
    next.type && allowedTypes.has(next.type) ? next.type : activeLayout.type;

  activeLayout = {
    experience: next.experience ?? activeLayout.experience,
    type: resolvedType,
    preset:
      next.preset !== undefined
        ? next.preset
        : activeLayout.preset,
    regionPolicy: next.regionPolicy
      ? {
          nav: {
            enabled:
              next.regionPolicy.nav?.enabled ?? activeLayout.regionPolicy.nav.enabled,
            placement:
              next.regionPolicy.nav?.placement ?? activeLayout.regionPolicy.nav.placement,
          },
          regions: {
            ...activeLayout.regionPolicy.regions,
            ...(next.regionPolicy.regions
              ? Object.fromEntries(
                  Object.entries(next.regionPolicy.regions).map(([k, v]) => [
                    k,
                    { enabled: v.enabled ?? activeLayout.regionPolicy.regions[k]?.enabled ?? true },
                  ])
                )
              : {}),
          },
        }
      : activeLayout.regionPolicy,
  };

  listeners.forEach(l => l());
}


/**
 * ======================================================
 * SUBSCRIBE TO LAYOUT CHANGES
 * Required by useSyncExternalStore
 * ======================================================
 */
export function subscribeLayout(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}


