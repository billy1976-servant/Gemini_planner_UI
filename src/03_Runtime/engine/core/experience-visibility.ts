/**
 * Experience visibility filter — config-driven.
 * Strategy per experience from experience-visibility.json; no hardcoded experience branches.
 */

import experienceVisibilityConfig from "../../../config/experience-visibility.json";

export type ExperienceVisibilityResult = "render" | "collapse" | "hide" | "step";

type VisibilityConfig = {
  strategy: "renderAll" | "dashboard" | "step" | "maxDepth";
  depth1Section?: "collapse";
  useStepIndex?: boolean;
  maxDepth?: number;
};

const CONFIG = experienceVisibilityConfig as Record<string, VisibilityConfig>;
const DEFAULT_STRATEGY: VisibilityConfig = { strategy: "renderAll" };

export function getExperienceVisibility(
  experience: string,
  node: { type?: string; id?: string; role?: string; slot?: string; slotKey?: string },
  depth: number,
  stepIndex: number,
  sectionKeys: string[] = [],
  activeSectionKey?: string | null
): ExperienceVisibilityResult {
  const type = (node?.type ?? "").toString().toLowerCase();
  const sectionKey = (node?.id ?? node?.role) ?? "";
  const cfg = CONFIG[experience] ?? DEFAULT_STRATEGY;
  const strategy = cfg.strategy ?? "renderAll";

  if (strategy === "renderAll") return "render";

  if (strategy === "maxDepth") {
    const maxD = typeof cfg.maxDepth === "number" ? cfg.maxDepth : 2;
    return depth <= maxD ? "render" : "hide";
  }

  if (strategy === "dashboard") {
    if (depth === 0) return "render";
    if (depth === 1 && type !== "section") return "hide";
    if (depth === 1 && type === "section") {
      const active = activeSectionKey ?? sectionKeys[0] ?? "";
      return sectionKey === active ? "render" : (cfg.depth1Section === "collapse" ? "collapse" : "hide");
    }
    return "render";
  }

  if (strategy === "step") {
    if (depth === 0) return "render";
    if (depth === 1) {
      if (type !== "section") return "hide";
      const currentKey = cfg.useStepIndex
        ? sectionKeys[stepIndex] ?? sectionKeys[0]
        : sectionKeys[0];
      return sectionKey === currentKey ? "render" : "hide";
    }
    return "render";
  }

  return "render";
}
