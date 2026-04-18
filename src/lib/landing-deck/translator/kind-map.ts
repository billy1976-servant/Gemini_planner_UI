import type { OutlineTemplateId } from "@/lib/landing-deck/outline/types";

/** Minimal legacy “kind” → existing outline `templateId` (deterministic, no inference). */
export const KIND_MAP = {
  hero: "heroHook",
  teach: "teachingStamped",
  quiz: "quizSelectStamped",
  summary: "summaryTextOnly",
  cta: "ctaStamped",
} as const satisfies Record<string, OutlineTemplateId>;

export type SlideKind = keyof typeof KIND_MAP;
