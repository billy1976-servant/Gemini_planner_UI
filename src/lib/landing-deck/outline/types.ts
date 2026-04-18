import type { DeckSlideMode } from "@/lib/deck-platform/deck-slide-modes";
import type { LandingDeckScreen } from "@/lib/landing-deck/schema";

export const OUTLINE_TEMPLATE_IDS = [
  "introStamped",
  "teachingStamped",
  "heroHook",
  "quizSelectStamped",
  "ctaStamped",
  "summaryTextOnly",
  "proofStamped",
] as const;

export type OutlineTemplateId = (typeof OUTLINE_TEMPLATE_IDS)[number];

export type OutlineMediaRef =
  | { type: "image"; src: string; alt: string; caption?: string }
  | { type: "video"; src: string; alt?: string; caption?: string };

export type DeckOutlineMeta = {
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
  title?: string;
  subtitle?: string;
  paragraphs?: string[];
  bullets?: string[];
  badge?: string;
  layoutOverride?: string;
  modes?: DeckSlideMode[];
  /** Keys into `DeckOutline.media` */
  mediaKeys?: string[];
  quizSelect?: OutlineQuizSelect;
  /** `trackerResponse.rule.type === "valueLabel"` map */
  trackerValueLabels?: Record<string, string>;
  /** When set with quizSelect, wires tracker line for sidebar */
  trackerEnabled?: boolean;
  /** Passed through to compiled screen (`LandingDeckRenderer` reveal / pacing). */
  presentation?: LandingDeckScreen["presentation"];
};

export type DeckOutline = {
  meta: DeckOutlineMeta;
  media?: Record<string, OutlineMediaRef>;
  slides: OutlineSlide[];
};
