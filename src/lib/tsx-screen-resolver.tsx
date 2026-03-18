"use client";

import React from "react";
import nextDynamic from "next/dynamic";

/**
 * Shared TSX screen resolver so root and dev both can resolve TSX by path.
 * Used to render TSX screens through the same pipeline (ExperienceRenderer → JsonRenderer → JsonSkinEngine)
 * via tsx-embed nodes with TsxEmbedProvider.
 */

const tsxContext = (require as any).context(
  "../01_App/(dead) Tsx",
  true,
  /\.tsx$/
);
const businessContext = (require as any).context(
  "../01_App/Business",
  true,
  /\.tsx$/
);
const containerCreationsContext = (require as any).context(
  "../01_App/ContainerCreations",
  true,
  /\.tsx$/
);

function normalizeContextKey(key: string) {
  return key
    .replace(/^\.\//, "")
    .replace(/^\.\\/, "")
    .replace(/\\/g, "/")
    .replace(/\.tsx$/, "");
}

function resolveTsxModule(mod: any, normalizedKey: string): React.ComponentType<any> {
  const name = normalizedKey.split("/").pop() ?? normalizedKey;
  return mod?.default ?? mod?.[name] ?? mod;
}

const AUTO_TSX_MAP: Record<string, () => Promise<any>> = {};
tsxContext.keys().forEach((key: string) => {
  const normalized = normalizeContextKey(key);
  AUTO_TSX_MAP[normalized] = () =>
    Promise.resolve(tsxContext(key)).then((m: any) => resolveTsxModule(m, normalized));
});
businessContext.keys().forEach((key: string) => {
  const normalized = normalizeContextKey(key);
  AUTO_TSX_MAP[`Business/${normalized}`] = () =>
    Promise.resolve(businessContext(key)).then((m: any) => resolveTsxModule(m, normalized));
});
containerCreationsContext.keys().forEach((key: string) => {
  const normalized = normalizeContextKey(key);
  AUTO_TSX_MAP[`ContainerCreations/${normalized}`] = () =>
    Promise.resolve(containerCreationsContext(key)).then((m: any) => resolveTsxModule(m, normalized));
});

const EXPLICIT_TSX_MAP: Record<string, () => Promise<any>> = {
  "ContainerCreations/Learn/landing/ContainerCreationsWebsite": () =>
    import("@/01_App/ContainerCreations/Learn/landing/ContainerCreationsWebsite"),
  "ContainerCreations/Learn/landing/ContainerCreationsLanding": () =>
    import("@/01_App/ContainerCreations/Learn/landing/ContainerCreationsLanding"),
  "Business/Container_Creations/ContainerCreationsWebsite": () =>
    import("@/01_App/ContainerCreations/Learn/landing/ContainerCreationsWebsite"),
  "Business/Container_Creations/ContainerCreationsLanding": () =>
    import("@/01_App/ContainerCreations/Learn/landing/ContainerCreationsLanding"),
  "Christian/Discipleship/GospelDiscipleship": () =>
    import("@/01_App/HIClarify/Christian/Discipleship/GospelDiscipleship"),
  "Runtime/FlowRuntimeScreen": () =>
    import("@/engine/onboarding/FlowRuntimeScreen"),
};

export function resolveTsxScreen(path: string): React.ComponentType<any> | null {
  const normalized = path
    .replace(/^tsx:/, "")
    .replace(/\\/g, "/")
    .trim();

  // Universal flow runtime — resolve by key or path containing FlowRuntimeScreen
  if (normalized === "Runtime/FlowRuntimeScreen" || (normalized.endsWith("/FlowRuntimeScreen") && normalized.includes("Runtime"))) {
    return nextDynamic(() => import("@/engine/onboarding/FlowRuntimeScreen"), { ssr: false });
  }

  if (EXPLICIT_TSX_MAP[normalized]) {
    return nextDynamic(EXPLICIT_TSX_MAP[normalized], { ssr: false });
  }
  if (AUTO_TSX_MAP[normalized]) {
    return nextDynamic(AUTO_TSX_MAP[normalized], { ssr: false });
  }
  const containerPath = `ContainerCreations/${normalized}`;
  if (AUTO_TSX_MAP[containerPath]) {
    return nextDynamic(AUTO_TSX_MAP[containerPath], { ssr: false });
  }
  if (EXPLICIT_TSX_MAP[containerPath]) {
    return nextDynamic(EXPLICIT_TSX_MAP[containerPath], { ssr: false });
  }
  const businessPath = `Business/${normalized}`;
  if (AUTO_TSX_MAP[businessPath]) {
    return nextDynamic(AUTO_TSX_MAP[businessPath], { ssr: false });
  }
  if (EXPLICIT_TSX_MAP[businessPath]) {
    return nextDynamic(EXPLICIT_TSX_MAP[businessPath], { ssr: false });
  }
  const christianPath = `Christian/${normalized}`;
  if (EXPLICIT_TSX_MAP[christianPath]) {
    return nextDynamic(EXPLICIT_TSX_MAP[christianPath], { ssr: false });
  }
  return null;
}
