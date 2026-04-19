import type { DeckSlideMode } from "@/lib/deck-platform/deck-slide-modes";
import type { LandingContentBlock, MediaBlock } from "@/lib/landing-content-blocks";
import type { LandingDeckButtonBlock, LandingDeckScreen } from "@/lib/landing-deck/schema";
import type { LandingScreenDensity, LandingVisualTone } from "@/lib/landing-screen-presentation";

export const OUTLINE_TEMPLATE_IDS = [
  "introStamped",
  "teachingStamped",
  "heroHook",
  "quizSelectStamped",
  "ctaStamped",
  "summaryTextOnly",
  "proofStamped",
  "comparisonTwoCol",
] as const;

/** V1 author-facing slide kinds (maps to `templateId` + compiler defaults). */
export const LEARN_SLIDE_TYPES_V1 = [
  "intro",
  "hero",
  "teach",
  "proof",
  "comparison",
  "quiz",
  "summary",
  "cta",
] as const;

export type LearnSlideTypeV1 = (typeof LEARN_SLIDE_TYPES_V1)[number];

export type OutlineTemplateId = (typeof OUTLINE_TEMPLATE_IDS)[number];

export type OutlineMediaRef =
  | { type: "image"; src: string; alt: string; caption?: string }
  | {
      type: "video";
      src: string;
      alt?: string;
      caption?: string;
      poster?: string;
      aspectRatio?: string;
    };

export type DeckOutlineMeta = {
  /** Authoring format marker for migrations (default implicit 1). */
  outlineFormatVersion?: 1 | 2 | 3;
  title: string;
  shopUrl: string;
  logoSrc?: string;
  logoAlt?: string;
  shopNowLabel?: string;
  stepTrackerTitle?: string;
  stepTrackerDescription?: string;
  showResponses?: boolean;
  responsePlaceholder?: string;
  deckPalette?: string;
  extraLinkKeys?: Record<string, string>;
};

/** V2: optional region activation for deterministic compile (see `outline/blueprint.ts`). */
export type SlideBlueprint = {
  mode?: "auto" | "explicit";
  activeRegions?: string[];
};

export type OutlineQuizSelect = {
  inputId: string;
  label?: string;
  options: { value: string; label: string }[];
  gateMessage?: string;
};

/** One outline step; compiler expands to a full `LandingDeckScreen`. */
export type OutlineSlide = {
  id: string;
  stepLabel?: string;
  templateId: OutlineTemplateId | string;
  /** Authoring UI kind; optional metadata (compiler uses `templateId`). */
  learnSlideType?: LearnSlideTypeV1;
  title?: string;
  subtitle?: string;
  paragraphs?: string[];
  bullets?: string[];
  badge?: string;
  layoutOverride?: string;
  modes?: DeckSlideMode[];
  lightTheme?: boolean;
  visualTone?: LandingVisualTone;
  density?: LandingScreenDensity;
  /** Keys into `DeckOutline.media` */
  mediaKeys?: string[];
  /** When set (including `[]`), used as `screen.media` instead of resolving `mediaKeys`. */
  inlineMedia?: MediaBlock[];
  quizSelect?: OutlineQuizSelect;
  /** `trackerResponse.rule.type === "valueLabel"` map */
  trackerValueLabels?: Record<string, string>;
  /** When set with quizSelect, wires tracker line for sidebar */
  trackerEnabled?: boolean;
  /** When set, used as `screen.content` instead of `buildContent(slide)` from paragraphs/bullets. */
  richContent?: LandingContentBlock[];
  /** Full button row for the compiled screen (hero CTAs, nav, etc.). */
  buttons?: LandingDeckButtonBlock[];
  /** Overrides the first `next` button label from template defaults. */
  nextButtonLabel?: string;
  /** Passed through to compiled screen (`LandingDeckRenderer` reveal / pacing). */
  presentation?: LandingDeckScreen["presentation"];
  blueprint?: SlideBlueprint;
};

export type DeckOutline = {
  meta: DeckOutlineMeta;
  media?: Record<string, OutlineMediaRef>;
  slides: OutlineSlide[];
};
