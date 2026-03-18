"use client";

import type React from "react";
import type { FlowConfig } from "@/engine/onboarding/flow-engine/types";

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
  /** Flow engine config for JSON-driven FlowRuntime screens (dev-only). */
  flowScreenPath?: string;
  flowConfig?: FlowConfig | null;
  flowCurrentScreenId?: string | null;
  /** Currently selected flow screen id in Nodes panel (for highlight / inspector). */
  selectedFlowNodeId?: string | null;
  /** Optional: callback when flow config is edited in dev tools (in-memory only). */
  onFlowConfigChange?: (config: FlowConfig) => void;
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

/** Dev-only: register FlowRuntime config so Nodes panel can build a node list. */
export function setDevFlowProps(
  screenPath: string,
  config: FlowConfig,
  currentScreenId?: string | null
): void {
  current = {
    ...(current ?? {}),
    flowScreenPath: screenPath,
    flowConfig: config,
    flowCurrentScreenId:
      currentScreenId != null
        ? currentScreenId
        : (config.screens && config.screens.length > 0 ? config.screens[0].id : null),
  };
  listeners.forEach((fn) => fn());
}

/** Dev-only: update FlowRuntime config in-memory when editor changes are applied. */
export function setDevFlowConfig(config: FlowConfig): void {
  if (!current) return;
  current = {
    ...current,
    flowConfig: config,
  };
  if (current.onFlowConfigChange) {
    current.onFlowConfigChange(config);
  }
  listeners.forEach((fn) => fn());
}

/** Dev-only: update a single flow screen by id; triggers re-render of FlowEngine when store config is used. */
export function updateFlowNode(
  screenPath: string,
  nodeId: string,
  updates: Partial<FlowConfig["screens"][number]>
): void {
  const c = current?.flowConfig;
  if (!c || current?.flowScreenPath !== screenPath || !c.screens?.length) return;
  const nextScreens = c.screens.map((s) =>
    s.id === nodeId ? { ...s, ...updates } : s
  );
  setDevFlowConfig({ ...c, screens: nextScreens });
}

export function setSelectedLandingNodeId(id: string | null): void {
  current = { ...(current ?? {}), selectedLandingNodeId: id };
  listeners.forEach((fn) => fn());
}

/** Dev-only: set selected flow screen id so panel and canvas can stay in sync. */
export function setSelectedFlowNodeId(id: string | null): void {
  current = { ...(current ?? {}), selectedFlowNodeId: id };
  listeners.forEach((fn) => fn());
}

export function subscribeDevSidebarProps(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}
