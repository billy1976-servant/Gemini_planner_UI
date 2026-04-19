import type { LearnSlideTypeV1, OutlineTemplateId } from "@/lib/landing-deck/outline/types";

export const LEARN_SLIDE_TYPE_TO_TEMPLATE: Record<LearnSlideTypeV1, OutlineTemplateId> = {
  intro: "introStamped",
  hero: "heroHook",
  teach: "teachingStamped",
  proof: "proofStamped",
  comparison: "comparisonTwoCol",
  quiz: "quizSelectStamped",
  summary: "summaryTextOnly",
  cta: "ctaStamped",
};

export function learnSlideTypeToTemplateId(kind: LearnSlideTypeV1): OutlineTemplateId {
  return LEARN_SLIDE_TYPE_TO_TEMPLATE[kind];
}
