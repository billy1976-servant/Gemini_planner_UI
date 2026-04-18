import type { SlideKind } from "./kind-map";

export type KindRule = {
  required: readonly string[];
  optional: readonly string[];
  forbidden: readonly string[];
};

const RICH_BODY_KEYS = [
  "richContent",
  "buttons",
  "inlineMedia",
  "mediaKeys",
  "nextButtonLabel",
] as const;

const COMMON_OPTIONAL = [
  "title",
  "subtitle",
  "paragraphs",
  "bullets",
  "badge",
  "stepLabel",
  "layoutOverride",
  "trackerValueLabels",
  "trackerEnabled",
  "visualTone",
  "density",
  "lightTheme",
  ...RICH_BODY_KEYS,
] as const;

/**
 * Per-kind content constraints (keys in the **content** map only).
 * `presentation`, `modes`, and `blueprint` live on the **structure** slide row.
 */
export const KIND_RULES: Record<SlideKind, KindRule> = {
  intro: {
    required: [],
    optional: [...COMMON_OPTIONAL],
    forbidden: ["quizSelect"],
  },
  hero: {
    required: [],
    optional: [...COMMON_OPTIONAL],
    forbidden: ["quizSelect"],
  },
  teach: {
    required: ["title"],
    optional: [...COMMON_OPTIONAL],
    forbidden: ["quizSelect"],
  },
  proof: {
    required: ["title"],
    optional: [...COMMON_OPTIONAL],
    forbidden: ["quizSelect"],
  },
  comparison: {
    required: ["title"],
    optional: [...COMMON_OPTIONAL],
    forbidden: ["quizSelect"],
  },
  quiz: {
    required: ["quizSelect"],
    optional: [
      "title",
      "subtitle",
      "paragraphs",
      "badge",
      "stepLabel",
      "layoutOverride",
      "trackerValueLabels",
      "trackerEnabled",
      "visualTone",
      "density",
      "lightTheme",
      "richContent",
      "buttons",
      "inlineMedia",
      "mediaKeys",
      "nextButtonLabel",
    ],
    forbidden: ["bullets"],
  },
  summary: {
    required: [],
    optional: [...COMMON_OPTIONAL],
    forbidden: ["quizSelect"],
  },
  cta: {
    required: [],
    optional: [...COMMON_OPTIONAL],
    forbidden: ["quizSelect"],
  },
};
