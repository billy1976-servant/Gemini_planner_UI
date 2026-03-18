"use client";

/**
 * TSX screen registry — auto-loads all screens under src/01_App/Business/**,
 * src/01_App/ContainerCreations/**, and Runtime/FlowRuntimeScreen.
 */

import React, { Suspense } from "react";

// Next.js: require.context (no import.meta.glob)
const businessModules = (require as any).context(
  "../01_App/Business",
  true,
  /\.tsx$/
);
const containerCreationsModules = (require as any).context(
  "../01_App/ContainerCreations",
  true,
  /\.tsx$/
);

type ModuleLoader = () => Promise<{ default?: React.ComponentType<any>; [key: string]: any }>;

const registry: Record<string, ModuleLoader> = {};
const registryKeys: string[] = [];

function normalizeRegistryKey(path: string): string {
  return path
    .replace(/^\.\//, "")
    .replace(/^\.\\/, "")
    .replace(/\\/g, "/")
    .replace(/\.tsx$/, "")
    .trim();
}

// Auto-register all Business/**/*.tsx
businessModules.keys().forEach((key: string) => {
  const normalized = normalizeRegistryKey(key);
  const registryKey = `Business/${normalized}`;
  registry[registryKey] = () => Promise.resolve(businessModules(key));
  if (!registryKeys.includes(registryKey)) registryKeys.push(registryKey);
});

// Auto-register all ContainerCreations/**/*.tsx
containerCreationsModules.keys().forEach((key: string) => {
  const normalized = normalizeRegistryKey(key);
  const registryKey = `ContainerCreations/${normalized}`;
  registry[registryKey] = () => Promise.resolve(containerCreationsModules(key));
  if (!registryKeys.includes(registryKey)) registryKeys.push(registryKey);
});

// Runtime/FlowRuntimeScreen (flow runtime)
registry["Runtime/FlowRuntimeScreen"] = () => import("@/engine/onboarding/FlowRuntimeScreen");
registryKeys.push("Runtime/FlowRuntimeScreen");

// Alias: flow JSON name → FlowRuntimeScreen (flowId/configUrl come from URL params)
registry["ContainerCreations/Learn/landing/ContainerCreationsLanding-5"] = () =>
  import("@/engine/onboarding/FlowRuntimeScreen");
registryKeys.push("ContainerCreations/Learn/landing/ContainerCreationsLanding-5");
registry["Business/Container_Creations/ContainerCreationsLanding-5"] = () =>
  import("@/engine/onboarding/FlowRuntimeScreen");
registryKeys.push("Business/Container_Creations/ContainerCreationsLanding-5");

function resolveComponentFromModule(mod: any, key: string): React.ComponentType<any> | null {
  const name = key.split("/").pop() ?? key;
  return mod?.default ?? mod?.[name] ?? mod ?? null;
}

/**
 * Normalize a requested path for lookup (strip tsx:, trim, no .tsx).
 */
export function normalizePath(path: string): string {
  return (path ?? "")
    .replace(/^tsx:/, "")
    .replace(/\\/g, "/")
    .trim()
    .replace(/\.tsx$/, "");
}

/**
 * All registered component keys (for logging and fallback suggestion).
 */
export function getRegistryKeys(): string[] {
  return [...registryKeys].sort();
}

/**
 * String similarity: Levenshtein-like; returns 0–1 (1 = exact match).
 */
function similarity(a: string, b: string): number {
  if (a === b) return 1;
  if (!a.length || !b.length) return 0;
  const aLower = a.toLowerCase();
  const bLower = b.toLowerCase();
  if (aLower.includes(bLower) || bLower.includes(aLower)) return 0.9;
  let matches = 0;
  const maxLen = Math.max(a.length, b.length);
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (aLower[i] === bLower[i]) matches++;
  }
  return matches / maxLen;
}

/**
 * Find the closest registry key to the requested path (for suggestion).
 */
export function getClosestMatch(requestedPath: string): { key: string; score: number } | null {
  const norm = normalizePath(requestedPath);
  if (!norm) return null;
  let best: { key: string; score: number } | null = null;
  for (const key of registryKeys) {
    const score = similarity(norm, key);
    if (score > 0 && (!best || score > best.score)) {
      best = { key, score };
    }
  }
  return best;
}

/**
 * Get a loader for a path, or null if not registered.
 */
export function getLoader(path: string): ModuleLoader | null {
  const norm = normalizePath(path);
  if (registry[norm]) return registry[norm];
  if (!norm.startsWith("ContainerCreations/") && registry[`ContainerCreations/${norm}`]) {
    return registry[`ContainerCreations/${norm}`];
  }
  if (!norm.startsWith("Business/") && registry[`Business/${norm}`]) {
    return registry[`Business/${norm}`];
  }
  return null;
}

const LOG_PREFIX = "[tsx-screen-registry]";

/**
 * getComponent implementation for TsxEmbedProvider.
 * Returns a React component (or null), logs REQUESTED / AVAILABLE, and on miss logs closest match.
 * options.wrapInEnvelope: if provided, the loaded component is wrapped (e.g. TSXScreenWithEnvelope).
 */
export function getComponent(
  path: string,
  options?: { wrapInEnvelope?: (screenPath: string, Component: React.ComponentType<any>) => React.ComponentType<any> }
): React.ComponentType<any> | null {
  const requested = normalizePath(path);
  const available = getRegistryKeys();

  if (typeof console !== "undefined" && console.log) {
    console.log(`${LOG_PREFIX} REQUESTED:`, path, "→ normalized:", requested);
    console.log(`${LOG_PREFIX} AVAILABLE (${available.length}):`, available);
  }

  const loader = getLoader(path);
  if (!loader) {
    if (typeof console !== "undefined" && console.log) {
      console.log(`${LOG_PREFIX} component found: no`);
    }
    const closest = getClosestMatch(path);
    if (typeof console !== "undefined" && console.warn) {
      console.warn(`${LOG_PREFIX} Component not found for path: "${path}" (normalized: "${requested}")`);
      if (closest && closest.score >= 0.3) {
        console.warn(`${LOG_PREFIX} Closest match: "${closest.key}" (score: ${closest.score.toFixed(2)})`);
      }
    }
    return null;
  }

  if (typeof console !== "undefined" && console.log) {
    console.log(`${LOG_PREFIX} component found: yes`);
  }

  const screenPath = requested;
  const LazyScreen = React.lazy(() =>
    loader()!.then((mod: any) => ({
      default: resolveComponentFromModule(mod, screenPath) || (() => null),
    }))
  );

  const fallback = React.createElement("div", { style: { padding: 24, textAlign: "center" } }, "Loading…");
  const Inner = () => React.createElement(Suspense, { fallback }, React.createElement(LazyScreen));

  if (options?.wrapInEnvelope) {
    return options.wrapInEnvelope(screenPath, Inner as React.ComponentType<any>);
  }
  return Inner as React.ComponentType<any>;
}

export { registry as tsxScreenRegistry, registryKeys as tsxScreenRegistryKeys };
