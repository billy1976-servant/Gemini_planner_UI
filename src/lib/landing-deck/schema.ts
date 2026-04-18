/**
 * Canonical TypeScript contract for Learn / landing-2 style deck JSON consumed by LandingDeckRenderer.
 * Import from here in compilers, validators, and APIs — not from the renderer implementation file.
 */

import type { SlideBuilderMeta } from "@/lib/slide-builder-recipes";
import type { LandingContentBlock, MediaBlock } from "@/lib/landing-content-blocks";
import type { LandingScreenDensity, LandingVisualTone } from "@/lib/landing-screen-presentation";
import type {
  DynamicSummaryConfig,
  StepTrackerResponseConfig,
  TrackerResponseConfig,
} from "@/lib/landing-tracker-responses";
import type { WalkthroughScreenConfig } from "@/lib/landing-walkthrough";
import type { DeckSlideMode } from "@/lib/deck-platform/deck-slide-modes";

export type LandingDeckButtonBlock =
  | { type: "link"; label: string; hrefKey: string; nodeId?: string }
  | { type: "goto"; label: string; target: string; nodeId?: string }
  | { type: "next"; label: string; nodeId?: string }
  | { type: "back"; label: string; nodeId?: string };

export type LandingDeckInlineControlId =
  | "containerLength"
  | "roofRibHeight"
  | "ventFitVerified"
  | "ventCount"
  | "orderSizeConfirmed";

/** One step / slide in a landing deck (mirrors runtime Screen in LandingDeckRenderer). */
export type LandingDeckScreen = {
  id: string;
  stepLabel: string;
  layout: string;
  title: string;
  subtitle?: string;
  content: LandingContentBlock[];
  media: MediaBlock[];
  buttons: LandingDeckButtonBlock[];
  nextScreenId?: string;
  inlineControls?: LandingDeckInlineControlId[];
  /** When true, textOnly layout shows generated summary instead of content. */
  dynamicSummary?: boolean;
  dynamicSummaryConfig?: DynamicSummaryConfig;
  trackerResponse?: TrackerResponseConfig;
  lightTheme?: boolean;
  nodePosition?: { x: number; y: number };
  visualTone?: LandingVisualTone;
  density?: LandingScreenDensity;
  /** Slide builder only; ignored at render time. */
  builderMeta?: SlideBuilderMeta;
  presentation?: {
    reveal?: "none" | "byBlock" | "custom";
    revealSequence?: string[];
  };
  walkthrough?: WalkthroughScreenConfig;
  modes?: DeckSlideMode[];
};

/** Root object for `v1.json` (and merged schema overlays) under learn flow folders. */
export type LandingDeckV1 = {
  shopUrl: string;
  header: { logoSrc: string; logoAlt: string; shopNowLabel: string };
  stepTracker: StepTrackerResponseConfig;
  screens: LandingDeckScreen[];
  /** Named URLs for link buttons (`hrefKey` values other than `shopUrl`). */
  extraLinkKeys?: Record<string, string>;
  /** Deck-wide palette id from `@/palettes`. */
  deckPalette?: string;
};

export type {
  LandingContentBlock,
  MediaBlock,
  DynamicSummaryConfig,
  StepTrackerResponseConfig,
  TrackerResponseConfig,
  WalkthroughScreenConfig,
  DeckSlideMode,
  LandingScreenDensity,
  LandingVisualTone,
  SlideBuilderMeta,
};
