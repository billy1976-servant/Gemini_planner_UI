import type { DeckOutline, OutlineSlide, LearnSlideTypeV1 } from "@/lib/landing-deck/outline/types";
import { learnSlideTypeToTemplateId } from "./learn-slide-type-map";

export function applyLearnSlideTypeChange(
  outline: DeckOutline,
  slideId: string,
  kind: LearnSlideTypeV1
): DeckOutline {
  const slides = outline.slides.map((s) => {
    if (s.id !== slideId) return s;
    const base: OutlineSlide = {
      ...s,
      learnSlideType: kind,
      templateId: learnSlideTypeToTemplateId(kind),
    };
    if (kind === "quiz") {
      return {
        ...base,
        quizSelect:
          s.quizSelect ??
          ({
            inputId: "quiz-answer",
            label: "Your answer",
            options: [
              { value: "a", label: "Option A" },
              { value: "b", label: "Option B" },
            ],
          } satisfies OutlineSlide["quizSelect"]),
      };
    }
    return {
      ...base,
      quizSelect: undefined,
      trackerValueLabels: undefined,
      trackerEnabled: false,
    };
  });
  return { ...outline, slides };
}
