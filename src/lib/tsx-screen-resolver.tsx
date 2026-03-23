"use client";

import React from "react";
import nextDynamic from "next/dynamic";

/**
 * Shared TSX screen resolver so root and dev both can resolve TSX by path.
 * Used to render TSX screens through the same pipeline (ExperienceRenderer → JsonRenderer → JsonSkinEngine)
 * via tsx-embed nodes with TsxEmbedProvider.
 */

type Ctx = {
  keys: () => string[];
  (id: string): any;
};

function tryCreateContext(basePath: string): Ctx | null {
  try {
    const req = require as any;
    if (!req?.context) return null;
    return req.context(basePath, true, /\.tsx$/) as Ctx;
  } catch {
    return null;
  }
}

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

const EXPLICIT_TSX_MAP: Record<string, () => Promise<any>> = {
  "Runtime/FlowRuntimeScreen": () =>
    import("@/engine/onboarding/FlowRuntimeScreen"),
  "hiclarify/christian/prayer/prayer-app": () =>
    import("@/01_App/hiclarify/christian/prayer/prayer-app"),
};

const AUTO_TSX_MAP: Record<string, () => Promise<any>> = {};

const contextSpecs: Array<{ ctx: Ctx | null; alias?: string }> = [
  { ctx: tryCreateContext("../01_App/(dead) tsx") },
  { ctx: tryCreateContext("../01_App/(dead) Tsx") },
  { ctx: tryCreateContext("../01_App/(live) Business"), alias: "(live) Business" },
];

for (const { ctx, alias } of contextSpecs) {
  if (!ctx) continue;
  ctx.keys().forEach((key: string) => {
    const normalized = normalizeContextKey(key);
    AUTO_TSX_MAP[normalized] = () =>
      Promise.resolve(ctx(key)).then((m: any) => resolveTsxModule(m, normalized));
    if (alias) {
      const prefixed = `${alias}/${normalized}`;
      AUTO_TSX_MAP[prefixed] = () =>
        Promise.resolve(ctx(key)).then((m: any) => resolveTsxModule(m, normalized));
    }
  });
}

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

  const businessPath = `(live) Business/${normalized}`;
  if (AUTO_TSX_MAP[businessPath]) {
    return nextDynamic(AUTO_TSX_MAP[businessPath], { ssr: false });
  }

  return null;
}
