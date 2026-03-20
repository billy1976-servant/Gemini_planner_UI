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
  Christian: () => import("@/01_App/hiclarify/christian/ChristianApp"),
  "Christian/prayer": () =>
    import("@/01_App/hiclarify/christian/prayer/prayer-app").then((m) => ({ default: m.PrayerApp })),
  "Christian/discipleship": () =>
    import("@/01_App/hiclarify/christian/Discipleship/GospelDiscipleship"),
  Business: () => import("@/01_App/business/BusinessApp"),
  Plan: () => import("@/01_App/hiclarify/plan/PlanApp"),
  Protect: () => import("@/01_App/hiclarify/protect/ProtectApp"),
  Research: () => import("@/01_App/hiclarify/research/ResearchApp"),
  Learn: () => import("@/01_App/hiclarify/learn/LearnApp"),
  // Domain-mapped full folder keys (getFolderForSubdomain returns these)
  "HIClarify/Christian": () => import("@/01_App/hiclarify/christian/ChristianApp"),
  "HIClarify/Christian/prayer": () =>
    import("@/01_App/hiclarify/christian/prayer/prayer-app").then((m) => ({ default: m.PrayerApp })),
  "HIClarify/Christian/discipleship": () =>
    import("@/01_App/hiclarify/christian/Discipleship/GospelDiscipleship"),
  "HIClarify/Learn": () => import("@/01_App/hiclarify/learn/LearnApp"),
  "HIClarify/Plan": () => import("@/01_App/hiclarify/plan/PlanApp"),
  "HIClarify/Protect": () => import("@/01_App/hiclarify/protect/ProtectApp"),
  "HIClarify/Research": () => import("@/01_App/hiclarify/research/ResearchApp"),
  // Domain/Subdomain/Route (ContainerCreations)
  "ContainerCreations/Learn/landing": () =>
    import("@/01_App/containercreations/learn/landing/ContainerCreationsLanding").then((m) => ({ default: m.default })),
  "ContainerCreations/Learn/onboarding": () =>
    import("@/01_App/containercreations/learn/onboarding/FlowsIndex").then((m) => ({ default: m.default })),
  "hiclarify/christian/prayer/prayer-app": () =>
    import("@/01_App/hiclarify/christian/prayer/prayer-app").then((m) => ({ default: m.default })),
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
