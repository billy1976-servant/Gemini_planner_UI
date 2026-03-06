"use client";

import type React from "react";

/** Minimal screen shape for landing flow node graph (Nodes panel). */
export type LandingFlowScreen = {
  id: string;
  title: string;
  stepLabel: string;
  layout: string;
  nextScreenId?: string;
  inlineControls?: string[];
  nodePosition?: { x: number; y: number };
  buttons: Array<{ type: string; target?: string; nodeId?: string }>;
};

/** Minimal landing config shape for Nodes panel (screens only). */
export type LandingConfig = {
  screens: Array<{
    id: string;
    title: string;
    layout: string;
    nextScreenId?: string;
    buttons: Array<{ type: string; target?: string }>;
  }>;
  [key: string]: unknown;
};

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
  /** When Container Creations landing is active, screens for Nodes panel flow graph */
  landingFlowScreens?: LandingFlowScreen[];
  /** When Container Creations landing (JSON flow) is active: screen path key for Nodes panel */
  landingScreenPath?: string;
  /** Full landing config; order is derived from config.screens unless overridden */
  landingConfig?: LandingConfig;
  /** Ordered screen ids for landing flow (default: config.screens.map(s => s.id)) */
  landingScreenOrder?: string[];
  /** Callback for sidebar to push updated landing config (in-memory only). */
  onLandingConfigChange?: (config: LandingConfig) => void;
  /** Currently selected node id in Nodes panel; landing uses this to highlight the screen. */
  selectedLandingNodeId?: string | null;
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

export function setDevLandingProps(
  screenPath: string,
  config: LandingConfig,
  onConfigChange?: (config: LandingConfig) => void
): void {
  const landingScreenOrder = Array.isArray(config.screens)
    ? config.screens.map((s) => s.id)
    : [];
  current = {
    ...(current ?? {}),
    landingScreenPath: screenPath,
    landingConfig: config,
    landingScreenOrder,
    onLandingConfigChange: onConfigChange ?? current?.onLandingConfigChange,
  };
  listeners.forEach((fn) => fn());
}

export function setSelectedLandingNodeId(id: string | null): void {
  current = { ...(current ?? {}), selectedLandingNodeId: id };
  listeners.forEach((fn) => fn());
}

export function subscribeDevSidebarProps(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}
