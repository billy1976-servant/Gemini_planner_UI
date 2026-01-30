/**
 * SCREEN LOADER — FINAL, STATE-SAFE (ID-FREE)
 *
 * Rules:
 * - Screen JSON may declare default state
 * - Default state is applied ONLY if state is empty
 * - User interaction always wins afterward
 *
 * Supports:
 * 1. JSON screens → fetched via /api/screens/*
 * 2. TSX screens → runtime-only via "tsx:" prefix
 *
 * Explicitly FORBIDS:
 * - screen IDs (screen-*, calculator-*, etc.)
 */
"use client";


import { dispatchState, getState } from "@/state/state-store";
import { warnBlueprintViolations } from "@/contracts/blueprint-universe.validator";


const SCREEN_BASE = "/api/screens";


export async function loadScreen(path: string) {
  if (!path) {
    throw new Error("loadScreen called with empty path");
  }


  /* ==================================================
     🚫 HARD STOP: SCREEN IDS ARE DEAD
     --------------------------------------------------
     This prevents silent fallback into old systems.
     ================================================== */
  if (!path.includes("/") && !path.startsWith("tsx:")) {
    throw new Error(
      `❌ Invalid screen reference (IDs are forbidden): "${path}"`
    );
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
     📄 JSON SCREEN PIPELINE
     ================================================== */
  const normalized = path
    .replace(/^\/+/, "")
    .replace(/^src\//, "")
    .replace(/^apps-offline\/apps\//, "")
    .replace(/^apps-offline\//, "")
    .replace(/^apps\//, "");

  // 🔑 CRITICAL: Disable ALL caching to force fresh screen loads
  // Browser and Next.js cache was preventing screen updates in localhost
  const cacheBuster = `?t=${Date.now()}`;
  const fetchUrl = `${SCREEN_BASE}/${normalized}${cacheBuster}`;
  
  console.log("[screen-loader] 🔍 Fetching screen", {
    originalPath: path,
    normalized,
    fetchUrl,
    timestamp: Date.now(),
  });
  
  const res = await fetch(fetchUrl, {
    cache: "no-store",
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
    },
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "No error details");
    console.error("[screen-loader] ❌ Fetch failed", {
      status: res.status,
      statusText: res.statusText,
      normalized,
      errorText,
    });
    throw new Error(
      `Screen load failed (${res.status}): ${normalized} - ${errorText}`
    );
  }


  const json = await res.json();

  // Contract validator (WARN-ONLY). Runs once per screen load, never blocks.
  try {
    warnBlueprintViolations(json, {
      source: "runtime-load",
      dedupeKeyPrefix: `runtime-load:${normalized}`,
      maxWarnings: 200,
    });
  } catch (e) {
    console.warn("[ContractValidator] runtime-load validation failed:", e);
  }

  // 🔑 LIFECYCLE: Log screen load
  console.log("[screen-loader] 📥 LOADED", {
    path: normalized,
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
  const state = getState();
  // 🔑 CRITICAL: ALWAYS apply JSON's default state when loading a new screen
  // Previous screen's state persists and causes when conditions to fail
  // We MUST reset to the new screen's default state
  if (json?.state?.currentView) {
    const currentState = state.currentView;
    const jsonState = json.state.currentView;
    const needsUpdate = currentState !== jsonState;
    
    console.log("[screen-loader] 🧠 State initialization check", {
      currentState,
      jsonDefaultState: jsonState,
      needsUpdate,
      willApply: needsUpdate,
      reason: needsUpdate 
        ? `State mismatch: "${currentState}" !== "${jsonState}" - applying JSON default`
        : `State matches: "${currentState}" === "${jsonState}" - but applying anyway to ensure sync`,
    });
    
    // ✅ ALWAYS apply - ensures screen loads with correct initial state
    // Even if state matches, we dispatch to ensure reactive updates trigger
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
}


