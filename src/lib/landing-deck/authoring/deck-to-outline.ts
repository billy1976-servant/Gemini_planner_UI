import type { LandingDeckV1, LandingDeckScreen } from "@/lib/landing-deck/schema";
import type { DeckOutline, OutlineSlide } from "@/lib/landing-deck/outline/types";
import { inferLearnSlideTypeFromScreen } from "./infer-learn-slide-type";
import { learnSlideTypeToTemplateId } from "./learn-slide-type-map";
import { extractQuizSelectFromScreen } from "./extract-quiz-from-screen";

function screenToOutlineSlide(screen: LandingDeckScreen): OutlineSlide {
  const learnSlideType = inferLearnSlideTypeFromScreen(screen);

  const quizSelect = extractQuizSelectFromScreen(screen);
  const trackerValueLabels =
    screen.trackerResponse?.rule?.type === "valueLabel"
      ? (screen.trackerResponse.rule as { map: Record<string, string> }).map
      : undefined;

  return {
    id: screen.id,
    stepLabel: screen.stepLabel,
    learnSlideType,
    templateId: learnSlideTypeToTemplateId(learnSlideType),
    title: screen.title,
    subtitle: screen.subtitle,
    modes: screen.modes,
    presentation: screen.presentation,
    lightTheme: screen.lightTheme,
    visualTone: screen.visualTone,
    density: screen.density,
    quizSelect,
    trackerValueLabels,
    trackerEnabled: screen.trackerResponse != null,
    richContent: JSON.parse(JSON.stringify(screen.content)) as OutlineSlide["richContent"],
    inlineMedia: JSON.parse(JSON.stringify(screen.media)) as OutlineSlide["inlineMedia"],
    buttons: screen.buttons?.length ? [...screen.buttons] : undefined,
  };
}

export function isDeckOutlineShape(v: unknown): v is DeckOutline {
  if (v == null || typeof v !== "object" || Array.isArray(v)) return false;
  const o = v as Record<string, unknown>;
  const meta = o.meta;
  if (meta == null || typeof meta !== "object" || Array.isArray(meta)) return false;
  const m = meta as Record<string, unknown>;
  if (typeof m.title !== "string" || typeof m.shopUrl !== "string") return false;
  if (!Array.isArray(o.slides)) return false;
  return true;
}

/** Bootstrap a `DeckOutline` from runtime JSON (lossy only when deck used unsupported patterns). */
export function landingDeckV1ToDeckOutline(deck: LandingDeckV1): DeckOutline {
  return {
    meta: {
      title: deck.stepTracker.title || "Learn deck",
      shopUrl: deck.shopUrl,
      logoSrc: deck.header.logoSrc,
      logoAlt: deck.header.logoAlt,
      shopNowLabel: deck.header.shopNowLabel,
      stepTrackerTitle: deck.stepTracker.title,
      stepTrackerDescription: deck.stepTracker.description,
      showResponses: deck.stepTracker.showResponses,
      responsePlaceholder: deck.stepTracker.responsePlaceholder,
      deckPalette: deck.deckPalette,
      extraLinkKeys: deck.extraLinkKeys,
    },
    media: {},
    slides: deck.screens.map((s) => screenToOutlineSlide(s)),
  };
}
