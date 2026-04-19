import type { LandingDeckScreen } from "@/lib/landing-deck/schema";
import type { DeckOutline, OutlineSlide, LearnSlideTypeV1 } from "@/lib/landing-deck/outline/types";
import { extractQuizSelectFromScreen } from "./extract-quiz-from-screen";
import { learnSlideTypeToTemplateId } from "./learn-slide-type-map";
import { inferLearnSlideTypeFromScreen } from "./infer-learn-slide-type";

/** Merge one compiled screen snapshot back into the hidden outline (v1 SSOT). */
export function mergeOutlineFromScreenSnapshot(
  outline: DeckOutline,
  screenId: string,
  screen: LandingDeckScreen,
  learnSlideType?: LearnSlideTypeV1
): DeckOutline {
  const slides = outline.slides.map((s) => {
    if (s.id !== screenId) return s;
    const kind = learnSlideType ?? s.learnSlideType ?? inferKindFallback(s, screen);
    const extractedQuiz = extractQuizSelectFromScreen(screen);
    const trackerValueLabels =
      screen.trackerResponse?.rule?.type === "valueLabel"
        ? (screen.trackerResponse.rule as { map: Record<string, string> }).map
        : s.trackerValueLabels;

    const scr = screen as Record<string, unknown>;
    const blueprint: OutlineSlide["blueprint"] | undefined =
      "blueprint" in scr ? (scr.blueprint as OutlineSlide["blueprint"] | undefined) : s.blueprint;
    const next: OutlineSlide = {
      ...s,
      learnSlideType: kind,
      templateId: learnSlideTypeToTemplateId(kind),
      stepLabel: screen.stepLabel,
      title: screen.title,
      subtitle: screen.subtitle,
      presentation: screen.presentation,
      modes: screen.modes,
      lightTheme: screen.lightTheme,
      visualTone: screen.visualTone,
      density: screen.density,
      richContent: JSON.parse(JSON.stringify(screen.content)) as OutlineSlide["richContent"],
      inlineMedia: JSON.parse(JSON.stringify(screen.media)) as OutlineSlide["inlineMedia"],
      buttons: screen.buttons.length > 0 ? [...screen.buttons] : undefined,
      quizSelect: kind === "quiz" ? extractedQuiz ?? s.quizSelect : undefined,
      trackerValueLabels: kind === "quiz" ? trackerValueLabels : s.trackerValueLabels,
      trackerEnabled: kind === "quiz" ? screen.trackerResponse != null : s.trackerEnabled,
      blueprint,
    };
    return next;
  });
  return { ...outline, slides };
}

function inferKindFallback(prev: OutlineSlide, screen: LandingDeckScreen): LearnSlideTypeV1 {
  if (prev.learnSlideType) return prev.learnSlideType;
  return inferLearnSlideTypeFromScreen(screen);
}
