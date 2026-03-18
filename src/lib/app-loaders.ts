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
  Christian: () => import("@/01_App/HIClarify/Christian/ChristianApp"),
  "Christian/prayer": () =>
    import("@/01_App/HIClarify/Christian/Prayer/PrayerApp").then((m) => ({ default: m.PrayerApp })),
  "Christian/discipleship": () =>
    import("@/01_App/HIClarify/Christian/Discipleship/GospelDiscipleship"),
  Business: () => import("@/01_App/Business/BusinessApp"),
  Plan: () => import("@/01_App/HIClarify/Plan/PlanApp"),
  Protect: () => import("@/01_App/HIClarify/Protect/ProtectApp"),
  Research: () => import("@/01_App/HIClarify/Research/ResearchApp"),
  Learn: () => import("@/01_App/HIClarify/Learn/LearnApp"),
  // Domain-mapped full folder keys (getFolderForSubdomain returns these)
  "HIClarify/Christian": () => import("@/01_App/HIClarify/Christian/ChristianApp"),
  "HIClarify/Christian/prayer": () =>
    import("@/01_App/HIClarify/Christian/Prayer/PrayerApp").then((m) => ({ default: m.PrayerApp })),
  "HIClarify/Christian/discipleship": () =>
    import("@/01_App/HIClarify/Christian/Discipleship/GospelDiscipleship"),
  "HIClarify/Learn": () => import("@/01_App/HIClarify/Learn/LearnApp"),
  "HIClarify/Plan": () => import("@/01_App/HIClarify/Plan/PlanApp"),
  "HIClarify/Protect": () => import("@/01_App/HIClarify/Protect/ProtectApp"),
  "HIClarify/Research": () => import("@/01_App/HIClarify/Research/ResearchApp"),
  // Domain/Subdomain/Route (ContainerCreations)
  "ContainerCreations/Learn/landing": () =>
    import("@/01_App/ContainerCreations/Learn/landing/ContainerCreationsLanding").then((m) => ({ default: m.default })),
  "ContainerCreations/Learn/onboarding": () =>
    import("@/01_App/ContainerCreations/Learn/onboarding/FlowsIndex").then((m) => ({ default: m.default })),
};

/** Path segment (e.g. /prayer, /learn) → loader key in APP_MODULE_LOADERS. */
export const PATH_SEGMENT_TO_LOADER_KEY: Record<string, string> = {
  prayer: "Christian/prayer",
  learn: "Learn",
  gospel: "Christian/discipleship",
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
