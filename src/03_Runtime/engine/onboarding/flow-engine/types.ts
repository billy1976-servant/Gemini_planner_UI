/**
 * Shared flow config types for the Flow Engine.
 * Schema aligns with Container Creations screen shape (id, stepLabel, layout, content, media, buttons).
 */

import type { LandingContentBlock } from "@/lib/landing-content-blocks";

export type FlowMediaBlock =
  | { type: "video"; src: string; caption?: string }
  | { type: "image"; src: string; alt: string }
  | {
      type: "beforeAfter";
      before: string;
      after: string;
      altBefore: string;
      altAfter: string;
    };

export type FlowButtonBlock =
  | { type: "link"; label: string; hrefKey?: string; href?: string; nodeId?: string }
  | { type: "goto"; label: string; target: string; nodeId?: string }
  | { type: "next"; label: string; nodeId?: string }
  | { type: "back"; label: string; nodeId?: string }
  | {
      type: "action";
      label: string;
      action: string;
      params?: Record<string, unknown>;
      nodeId?: string;
    };

export interface FlowScreen {
  id: string;
  stepLabel: string;
  layout: "hero" | "stamped" | "twoCol" | "twoColImageLeft" | "textOnly";
  title: string;
  subtitle?: string;
  content: LandingContentBlock[];
  media: FlowMediaBlock[];
  buttons: FlowButtonBlock[];
  nextScreenId?: string;
  /** When true, header/step use light theme. */
  lightTheme?: boolean;
  nodePosition?: { x: number; y: number };
}

export interface FlowStepTracker {
  title: string;
  description: string;
}

/** Optional domain-specific header (e.g. shop bar). Omit for minimal flow. */
export interface FlowHeader {
  logoSrc?: string;
  logoAlt?: string;
  shopNowLabel?: string;
  /** If set, logo and CTA link here. */
  shopUrl?: string;
}

export interface FlowConfig {
  id: string;
  title?: string;
  stepTracker: FlowStepTracker;
  /** Optional; when present, flow engine renders header bar. */
  header?: FlowHeader;
  /** If header.shopUrl is set, link and CTA use this. */
  shopUrl?: string;
  screens: FlowScreen[];
}

export interface FlowActionContext {
  /** Base path for the app (e.g. /prayer, /christian/prayer). */
  basePath?: string;
  /** Current flow config id. */
  flowId?: string;
  /** Current screen id. */
  screenId?: string;
  /** Arbitrary domain context (e.g. groupSlug, roomId). */
  domain?: Record<string, unknown>;
}

export type FlowActionHandler = (
  params: Record<string, unknown>,
  context: FlowActionContext
) => void | Promise<void>;
