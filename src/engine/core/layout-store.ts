"use client";

import layoutSchema from "@/lib/layout/layout-schema.json";
import type { LayoutExperience, NavPlacement } from "@/lib/layout/layout-engine/region-policy";

/**
 * ======================================================
 * ACTIVE LAYOUT STATE (PLAIN DATA ONLY)
 * ======================================================
 */
export type LayoutMode = "template" | "custom";

let activeLayout: {
  /**
   * Experience selector (Website/App/Learning).
   * This must NOT share a field with layout presets.
   */
  experience: LayoutExperience;
  type: string;
  preset: string | null;
  /**
   * Template-driven layout override (sections + visualPreset).
   * Used by JSON screens only; does not touch palette or behavior.
   */
  templateId: string;
  /**
   * When "template": apply profile.sections as defaults (organs can override).
   * When "custom": skip applying profile.sections in applyProfileToNode.
   */
  mode: LayoutMode;
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
  templateId: "modern-hero-centered",
  mode: "template",
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
  templateId?: string;
  mode?: LayoutMode;
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
    templateId:
      next.templateId !== undefined
        ? next.templateId
        : activeLayout.templateId,
    mode: next.mode !== undefined ? next.mode : activeLayout.mode,
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


