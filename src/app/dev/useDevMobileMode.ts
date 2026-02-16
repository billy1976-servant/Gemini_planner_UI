"use client";

import { useSyncExternalStore } from "react";

/**
 * Breakpoint for DEV_MOBILE_MODE: when viewport is below this width,
 * mobile dev layout applies (collapsible sidebars, hamburger, stacked panels).
 * Desktop layout unchanged above this.
 */
export const DEV_MOBILE_BREAKPOINT = 768;
export const DEV_TABLET_BREAKPOINT = 1024;

function getDevMobileMode(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth < DEV_MOBILE_BREAKPOINT;
}

function subscribeDevMobileMode(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onResize = () => cb();
  window.addEventListener("resize", onResize);
  return () => window.removeEventListener("resize", onResize);
}

/**
 * True when viewport width < 768px. Use to apply mobile dev layout only (CSS/classNames).
 * Does not change any runtime logic.
 */
export function useDevMobileMode(): boolean {
  return useSyncExternalStore(
    subscribeDevMobileMode,
    getDevMobileMode,
    () => false
  );
}
