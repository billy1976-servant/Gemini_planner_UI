import type { DeckOutline, LearnSlideTypeV1, OutlineSlide } from "@/lib/landing-deck/outline/types";
import type { LearnContentMap, LearnStructureInput, StructureSlide } from "./merge-structure-and-content";

const TEMPLATE_TO_KIND: Record<string, LearnSlideTypeV1> = {
  introStamped: "intro",
  heroHook: "hero",
  teachingStamped: "teach",
  proofStamped: "proof",
  comparisonTwoCol: "comparison",
  quizSelectStamped: "quiz",
  summaryTextOnly: "summary",
  ctaStamped: "cta",
};

function kindFromOutlineSlide(slide: OutlineSlide): LearnSlideTypeV1 {
  if (slide.learnSlideType) return slide.learnSlideType;
  const k = TEMPLATE_TO_KIND[String(slide.templateId)];
  if (k) return k;
  return "teach";
}

const CONTENT_KEYS: (keyof OutlineSlide)[] = [
  "title",
  "subtitle",
  "paragraphs",
  "bullets",
  "badge",
  "quizSelect",
  "richContent",
  "buttons",
  "inlineMedia",
  "mediaKeys",
  "stepLabel",
  "trackerValueLabels",
  "trackerEnabled",
  "layoutOverride",
  "nextButtonLabel",
  "visualTone",
  "density",
  "lightTheme",
];

/**
 * Partition a merged `DeckOutline` into structure + content files (round-trip with `mergeStructureAndContent`).
 */
export function deckOutlineToLearnSplit(outline: DeckOutline): {
  structure: LearnStructureInput;
  content: LearnContentMap;
} {
  const structure: LearnStructureInput = {
    meta: { ...outline.meta },
    ...(outline.media ? { media: { ...outline.media } } : {}),
    slides: [],
  };
  const content: LearnContentMap = {};

  for (const slide of outline.slides) {
    const kind = kindFromOutlineSlide(slide);
    const row: StructureSlide = {
      id: slide.id,
      kind,
      ...(slide.presentation !== undefined ? { presentation: slide.presentation } : {}),
      ...(slide.modes !== undefined ? { modes: slide.modes } : {}),
      ...(slide.blueprint !== undefined ? { blueprint: slide.blueprint } : {}),
    };
    structure.slides.push(row);

    const chunk: Record<string, unknown> = {};
    for (const key of CONTENT_KEYS) {
      const v = slide[key];
      if (v !== undefined) {
        (chunk as Record<string, unknown>)[key] = v as unknown;
      }
    }
    content[slide.id] = chunk;
  }

  return { structure, content };
}
