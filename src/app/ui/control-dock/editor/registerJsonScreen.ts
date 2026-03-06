"use client";

import { useEffect } from "react";
import { setDevLandingProps } from "@/app/ui/control-dock/dev-right-sidebar-store";
import type { LandingConfig } from "@/app/ui/control-dock/dev-right-sidebar-store";

/**
 * Register a JSON-driven screen with the dev node editor.
 * Call this when your screen has config.screens (e.g. landing flows).
 * The node editor will list nodes, allow selection, and push updates via onChange.
 *
 * @param screenPath - Unique key for this screen (e.g. "container-creations-landing")
 * @param config - Full config including screens array
 * @param onChange - Callback when the sidebar edits a node (in-memory only)
 */
export function registerJsonScreen(
  screenPath: string,
  config: LandingConfig,
  onChange?: (config: LandingConfig) => void
): void {
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
