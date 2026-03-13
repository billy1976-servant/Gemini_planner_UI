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

const EXPLICIT_TSX_MAP: Record<string, () => Promise<any>> = {
  "Business/Container_Creations/ContainerCreationsWebsite": () =>
    import("@/01_App/Business/Container_Creations/ContainerCreationsWebsite"),
  "Business/Container_Creations/ContainerCreationsLanding": () =>
    import("@/01_App/Business/Container_Creations/ContainerCreationsLanding"),
  "Christian/Discipleship/GospelDiscipleship": () =>
    import("@/01_App/Christian/Discipleship/GospelDiscipleship"),
};

export function resolveTsxScreen(path: string): React.ComponentType<any> | null {
  const normalized = path
    .replace(/^tsx:/, "")
    .replace(/\\/g, "/")
    .trim();

  if (EXPLICIT_TSX_MAP[normalized]) {
    return nextDynamic(EXPLICIT_TSX_MAP[normalized], { ssr: false });
  }
  if (AUTO_TSX_MAP[normalized]) {
    return nextDynamic(AUTO_TSX_MAP[normalized], { ssr: false });
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
