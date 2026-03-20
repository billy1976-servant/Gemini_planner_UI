import React from "react";

/**
 * Single source of truth for 01_App module loaders.
 * Used by both domain routing (_domain/[domain]) and path-based routing (e.g. /prayer).
 * Key: "domain" or "domain/segment" (e.g. "Learn", "Christian/prayer").
 */
export const APP_MODULE_LOADERS: Record<
  string,
  () => Promise<{ default: React.ComponentType<any> }>
> = {
  // Legacy short keys (path segment "christian" etc.)
  Christian: () => import("@/01_App/hiclarify/christian/christianapp"),
  "Christian/prayer": () =>
    import("@/01_App/hiclarify/christian/prayer/prayer-app").then((m) => ({ default: m.PrayerApp })),
  Business: () => import("@/01_App/business/businessapp"),
  Plan: () => import("@/01_App/hiclarify/plan/planapp"),
  Protect: () => import("@/01_App/hiclarify/protect/protectapp"),
  Research: () => import("@/01_App/hiclarify/research/researchapp"),
  Learn: () => import("@/01_App/hiclarify/learn/learnapp"),
  // Domain-mapped full folder keys (getFolderForSubdomain returns these)
  "HIClarify/Christian": () => import("@/01_App/hiclarify/christian/christianapp"),
  "HIClarify/Christian/prayer": () =>
    import("@/01_App/hiclarify/christian/prayer/prayer-app").then((m) => ({ default: m.PrayerApp })),
  "HIClarify/Learn": () => import("@/01_App/hiclarify/learn/learnapp"),
  "HIClarify/Plan": () => import("@/01_App/hiclarify/plan/planapp"),
  "HIClarify/Protect": () => import("@/01_App/hiclarify/protect/protectapp"),
  "HIClarify/Research": () => import("@/01_App/hiclarify/research/researchapp"),
  // Domain/Subdomain/Route (ContainerCreations)
  "ContainerCreations/Learn/landing": () =>
    import("@/01_App/containercreations/learn/landing/containercreationslanding").then((m) => ({ default: m.default })),
  "ContainerCreations/Learn/onboarding": () =>
    import("@/01_App/containercreations/learn/onboarding/flowsindex").then((m) => ({ default: m.default })),
  "hiclarify/christian/prayer/prayer-app": () =>
    import("@/01_App/hiclarify/christian/prayer/prayer-app").then((m) => ({ default: m.default })),
};

/** Path segment (e.g. /prayer, /learn) → loader key in APP_MODULE_LOADERS. */
export const PATH_SEGMENT_TO_LOADER_KEY: Record<string, string> = {
  prayer: "Christian/prayer",
  learn: "Learn",
  christian: "Christian",
  business: "Business",
  plan: "Plan",
  protect: "Protect",
  research: "Research",
};

export async function resolveAppByPath(
  segment: string
): Promise<React.ComponentType<any> | null> {
  const key = PATH_SEGMENT_TO_LOADER_KEY[segment?.toLowerCase()];
  const loader = key ? APP_MODULE_LOADERS[key] : null;
  if (!loader) return null;
  try {
    const mod = await loader();
    return mod.default;
  } catch {
    return null;
  }
}
