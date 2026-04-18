import type { LearnSlideTypeV1, OutlineTemplateId } from "@/lib/landing-deck/outline/types";

/** Learn slide kind → outline `templateId` (deterministic, no inference). */
export const KIND_MAP = {
  intro: "introStamped",
  hero: "heroHook",
  teach: "teachingStamped",
  proof: "proofStamped",
  comparison: "comparisonTwoCol",
  quiz: "quizSelectStamped",
  summary: "summaryTextOnly",
  cta: "ctaStamped",
} as const satisfies Record<LearnSlideTypeV1, OutlineTemplateId>;

export type SlideKind = LearnSlideTypeV1;
