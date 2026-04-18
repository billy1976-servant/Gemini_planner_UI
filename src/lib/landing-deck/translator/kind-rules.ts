import type { SlideKind } from "./kind-map";

export type KindRule = {
  required: readonly string[];
  optional: readonly string[];
  forbidden: readonly string[];
};

/**
 * Per-kind content constraints (keys refer to `OutlineSlide` fields other than `id` / `templateId`).
 * Shared keys (`stepLabel`, `mediaKeys`, …) are added in merge — see `merge-structure-and-content.ts`.
 */
export const KIND_RULES: Record<SlideKind, KindRule> = {
  hero: {
    required: [],
    optional: ["title", "subtitle", "paragraphs", "bullets", "badge"],
    forbidden: ["quizSelect"],
  },
  teach: {
    required: ["title"],
    optional: ["bullets", "paragraphs", "subtitle", "badge"],
    forbidden: ["quizSelect"],
  },
  quiz: {
    required: ["quizSelect"],
    optional: ["title", "subtitle", "paragraphs", "badge", "trackerValueLabels", "trackerEnabled"],
    forbidden: ["bullets"],
  },
  summary: {
    required: [],
    optional: ["title", "subtitle", "paragraphs", "bullets", "badge"],
    forbidden: ["quizSelect"],
  },
  cta: {
    required: [],
    optional: ["title", "subtitle", "paragraphs", "bullets", "badge"],
    forbidden: ["quizSelect"],
  },
};
