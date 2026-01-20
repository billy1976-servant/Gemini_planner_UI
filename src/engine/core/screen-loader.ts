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


  const res = await fetch(`${SCREEN_BASE}/${normalized}`);


  if (!res.ok) {
    throw new Error(
      `Screen load failed (${res.status}): ${normalized}`
    );
  }


  const json = await res.json();


  /* ==================================================
     🧠 DEFAULT STATE (SAFE APPLY)
     ================================================== */
  const state = getState();
  if (
    json?.state?.currentView &&
    state.currentView == null
  ) {
    dispatchState("currentView", json.state.currentView);
  }


  return json;
}


