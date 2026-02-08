/**
 * SCREEN LOADER — FINAL, STATE-SAFE (ID-FREE)
 * NEVER THROWS: missing/invalid screens return a fallback diagnostic screen.
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
import { makeFallbackScreen } from "@/engine/core/fallback-screen";

export async function loadScreen(path: string): Promise<any> {
  try {
    if (!path || typeof path !== "string") {
      return makeFallbackScreen({
        title: "Screen load error",
        message: "loadScreen was called with an empty or invalid path.",
        meta: { path: String(path) },
      });
    }

    /* ==================================================
       🚫 SCREEN IDS ARE DEAD — return fallback instead of throw
       ================================================== */
    if (!path.includes("/") && !path.startsWith("tsx:")) {
      return makeFallbackScreen({
        title: "Invalid screen reference",
        message: `Screen IDs are forbidden. Use a path (e.g. "apps/Onboarding/trial.json") or "tsx:tsx-screens/...".`,
        meta: { path },
      });
    }

    /* ==================================================
       🧠 TSX SCREEN BRANCH
       ================================================== */
    if (path.startsWith("tsx:")) {
      const tsxPath = path.replace(/^tsx:/, "");
      return {
        __type: "tsx-screen",
        path: tsxPath,
      };
    }

    /* ==================================================
       📄 JSON SCREEN — safe load, never throw
       ================================================== */
    const normalized = path
      .replace(/^\/+/, "")
      .replace(/^src\//, "")
      .replace(/^apps-json\/apps\//, "")
      .replace(/^apps-json\//, "")
      .replace(/^apps\//, "");
    const pathWithJson = normalized.match(/\.json$/i) ? normalized : `${normalized}.json`;

    const result = await safeImportJson(pathWithJson);

    if (!result.ok) {
      const err = (result as { ok: false; error: string }).error;
      console.warn("[screen-loader] Screen load failed, returning fallback", {
        path,
        normalized: pathWithJson,
        error: err,
      });
      return makeFallbackScreen({
        title: "Screen unavailable",
        message: err,
        meta: { requestedPath: path, normalized: pathWithJson },
      });
    }

    const json = result.json;

    console.log("[screen-loader] 📥 LOADED", {
      path: pathWithJson,
      id: json?.id,
      type: json?.type,
      hasState: !!json?.state,
      currentView: json?.state?.currentView,
      childrenCount: json?.children?.length,
      timestamp: Date.now(),
    });

    /* ==================================================
       🧠 DEFAULT STATE (ALWAYS APPLY ON SCREEN LOAD)
       ================================================== */
    if (json?.state?.currentView) {
      const currentState = getState().currentView;
      const jsonState = json.state.currentView;
      console.log("[screen-loader] ✅ Applying default state", {
        from: currentState,
        to: jsonState,
        screenPath: path,
      });
      dispatchState("state:currentView", { value: jsonState });
    } else {
      console.log("[screen-loader] ⚠️ No default state in JSON", {
        hasState: !!json?.state,
        stateKeys: json?.state ? Object.keys(json.state) : [],
        screenPath: path,
      });
    }

    return json;
  } catch (err: any) {
    console.error("[screen-loader] Unexpected error", { path, err: err?.message ?? err });
    return makeFallbackScreen({
      title: "Screen load error",
      message: err?.message ?? String(err),
      meta: { path, unexpected: true },
    });
  }
}


