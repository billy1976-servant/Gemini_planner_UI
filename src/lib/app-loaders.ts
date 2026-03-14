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
  Christian: () => import("@/01_App/Christian/ChristianApp"),
  "Christian/prayer": () =>
    import("@/01_App/Christian/Prayer/PrayerApp").then((m) => ({ default: m.PrayerApp })),
  "Christian/discipleship": () =>
    import("@/01_App/Christian/Discipleship/GospelDiscipleship"),
  Business: () => import("@/01_App/Business/BusinessApp"),
  Plan: () => import("@/01_App/Plan/PlanApp"),
  Protect: () => import("@/01_App/Protect/ProtectApp"),
  Research: () => import("@/01_App/Research/ResearchApp"),
  Learn: () => import("@/01_App/Learn/LearnApp"),
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
