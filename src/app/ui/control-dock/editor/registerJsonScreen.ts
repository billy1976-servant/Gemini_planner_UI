"use client";

import { useEffect } from "react";
import { setDevLandingProps } from "@/app/ui/control-dock/dev-right-sidebar-store";
import type { LandingConfig } from "@/app/ui/control-dock/dev-right-sidebar-store";

/** Known fallback keys that must not be passed; use getCanonicalScreenKey(searchParams) only. */
const FORBIDDEN_SCREEN_KEYS = ["container-creations-landing"];

/**
 * Register a JSON-driven screen with the dev node editor.
 * Call this when your screen has config.screens (e.g. landing flows).
 * Only call when you have a canonical key: getCanonicalScreenKey(searchParams) != null.
 *
 * @param screenPath - Must be getCanonicalScreenKey(searchParams); no fallbacks.
 * @param config - Full config including screens array
 * @param onChange - Callback when the sidebar edits a node (in-memory only)
 */
export function registerJsonScreen(
  screenPath: string,
  config: LandingConfig,
  onChange?: (config: LandingConfig) => void
): void {
  if (FORBIDDEN_SCREEN_KEYS.includes(screenPath) && typeof console !== "undefined" && console.warn) {
    console.warn(
      "[registerJsonScreen] Called with non-canonical key. Use getCanonicalScreenKey(searchParams) and only call when non-null."
    );
  }
  setDevLandingProps(screenPath, config, onChange);
}

/**
 * Hook: register this screen with the node editor when config has screens.
 * Use in any TSX screen that has config.screens so the Nodes panel works automatically.
 */
export function useRegisterJsonScreen(
  screenPath: string,
  config: { screens?: unknown[] } | null,
  setConfig: (config: LandingConfig) => void
): void {
  useEffect(() => {
    if (!config?.screens?.length) return;
    registerJsonScreen(screenPath, config as LandingConfig, (newConfig) => setConfig(newConfig));
  }, [screenPath, config, setConfig]);
}
