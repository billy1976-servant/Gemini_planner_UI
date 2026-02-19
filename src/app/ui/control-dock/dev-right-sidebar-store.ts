"use client";

import type React from "react";

/**
 * Optional props the dev page can set for the right sidebar (Layout panel, palette preview).
 * When the sidebar is rendered from the layout (always on /dev), it reads from this store.
 */
export type DevSidebarPropsFromPage = {
  layoutPanelContent?: React.ReactNode;
  palettePreviewScreen?: unknown;
  /** When a TSX website screen is active, set by that screen so Nodes panel can show reorder UI */
  websiteNodeOrder?: string[];
  websiteScreenPath?: string;
  palettePreviewProps?: {
    defaultState?: unknown;
    profileOverride?: unknown;
    sectionLayoutPresetOverrides?: Record<string, string>;
    cardLayoutPresetOverrides?: Record<string, string>;
    organInternalLayoutOverrides?: Record<string, string>;
    screenKey: string;
    behaviorProfile?: string;
    experience?: string;
    sectionKeys?: string[];
    sectionLabels?: Record<string, string>;
  };
};

let current: DevSidebarPropsFromPage | null = null;
const listeners = new Set<() => void>();

export function getDevSidebarProps(): DevSidebarPropsFromPage | null {
  return current;
}

export function setDevSidebarProps(props: DevSidebarPropsFromPage | null): void {
  current = props;
  listeners.forEach((fn) => fn());
}

export function setDevWebsiteNodeOrder(screenPath: string, nodeOrder: string[]): void {
  current = { ...(current ?? {}), websiteScreenPath: screenPath, websiteNodeOrder: nodeOrder };
  listeners.forEach((fn) => fn());
}

export function subscribeDevSidebarProps(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}
