"use client";

import React from "react";
import nextDynamic from "next/dynamic";

/**
 * Shared TSX screen resolver so root and dev both can resolve TSX by path.
 * Used to render TSX screens through the same pipeline (ExperienceRenderer → JsonRenderer → JsonSkinEngine)
 * via tsx-embed nodes with TsxEmbedProvider.
 */

const EXPLICIT_TSX_MAP: Record<string, () => Promise<any>> = {
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
  return null;
}
