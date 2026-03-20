/**
 * SCREEN LOADER — STRICT (NO FALLBACK)
 *
 * Rules:
 * - Screen JSON may declare default state
 * - Default state is applied ONLY if state is empty
 * - User interaction always wins afterward
 *
 * Supports:
 * 1. JSON screens → loaded via safeImportJson (fetch /api/screens/* or fs in Node)
 * 2. TSX screens → runtime-only via "tsx:" prefix
 *
 * Explicitly FORBIDS:
 * - screen IDs (screen-*, calculator-*, etc.)
 */
"use client";

import { dispatchState, getState } from "@/state/state-store";
import { safeImportJson } from "@/engine/core/safe-json-import";

type ResolveScreenResponse = {
  type: "json" | "tsx";
  path: string;
  resolvedFilePath: string;
  source: "integrations" | "dead-json" | "live-json" | "tsx";
};

export async function loadScreen(path: string): Promise<any> {
  try {
    if (!path || typeof path !== "string") {
      throw new Error("SCREEN LOAD FAILED — NO FALLBACK ALLOWED");
    }

    path = decodeURIComponent(path);

    if (!path.includes("/") && !path.startsWith("tsx:")) {
      throw new Error("SCREEN LOAD FAILED — NO FALLBACK ALLOWED");
    }

    if (path.startsWith("tsx:")) {
      const tsxPath = path.replace(/^tsx:/, "");
      return { __type: "tsx-screen", path: tsxPath };
    }

    const normalized = path
      .replace(/^\/+/, "")
      .replace(/^src\//, "")
      .replace(/^apps-json\/apps\//, "")
      .replace(/^apps-json\//, "")
      .replace(/^apps\//, "");
    const normalizedWithoutJson = normalized.replace(/\.json$/i, "");

    const resolveSegments = normalizedWithoutJson.split("/").filter(Boolean);
    const resolvePath =
      resolveSegments.length >= 4 ? resolveSegments.slice(2).join("/") : resolveSegments.join("/");

    const resolveUrl = `/api/screens/resolve-strict/${resolvePath}?t=${Date.now()}`;
    const resolveRes = await fetch(resolveUrl, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache, no-store", Pragma: "no-cache" },
    });

    if (resolveRes.status === 404) throw new Error("SCREEN LOAD FAILED — NO FALLBACK ALLOWED");
    if (!resolveRes.ok) throw new Error("SCREEN LOAD FAILED — NO FALLBACK ALLOWED");

    const resolved = (await resolveRes.json()) as ResolveScreenResponse;

    if (resolved.type === "tsx") {
      return {
        __type: "tsx-screen",
        path: resolved.path,
        __resolvedTsxPath: resolved.path,
        __resolvedTsxFilePath: resolved.resolvedFilePath,
      };
    }

    const result = await safeImportJson(resolved.path);
    if (!result.ok) throw new Error("SCREEN LOAD FAILED — NO FALLBACK ALLOWED");

    const json = result.json;

    (json as any).__resolvedJsonPath = result.resolvedPath ? result.resolvedPath : resolved.path;

    if (json?.state?.currentView) {
      dispatchState("state:currentView", { value: json.state.currentView });
    }

    return json;
  } catch {
    throw new Error("SCREEN LOAD FAILED — NO FALLBACK ALLOWED");
  }
}


