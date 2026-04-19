import type { LandingDeckButtonBlock } from "@/lib/landing-deck/schema";
import type { DeckOutline, LearnSlideTypeV1, OutlineSlide } from "@/lib/landing-deck/outline/types";

/** Stamped on `LandingDeckV1` when compiled from Learn authoring (runtime ignores). */
export const LEARN_DECK_SCHEMA_VERSION = 3 as const;

/** Button types allowed for this slide kind (aligns with `validate-landing-deck` layout rules). */
export function allowedLearnButtonTypes(kind: LearnSlideTypeV1 | undefined): LandingDeckButtonBlock["type"][] {
  if (!kind) return ["link", "goto", "next", "back"];
  switch (kind) {
    case "hero":
      return ["link", "goto"];
    case "summary":
      return ["link"];
    default:
      return ["link", "goto", "next", "back"];
  }
}

function slideKindForContract(slide: OutlineSlide): LearnSlideTypeV1 | undefined {
  return slide.learnSlideType;
}

/** Deterministic checks before compile (buttons vs slide kind). */
export function validateLearnAuthoringContracts(outline: DeckOutline): string[] {
  const errors: string[] = [];
  for (const slide of outline.slides) {
    const id = slide.id;
    const kind = slideKindForContract(slide);
    const allowed = new Set(allowedLearnButtonTypes(kind));
    const buttons = slide.buttons;
    if (!buttons?.length) continue;
    for (let i = 0; i < buttons.length; i++) {
      const t = buttons[i]?.type;
      if (t && !allowed.has(t)) {
        errors.push(
          `Slide "${id}": button ${i + 1} type "${t}" is not allowed for slide kind "${kind ?? "unknown"}" (allowed: ${[...allowed].join(", ")}).`
        );
      }
    }
  }
  return errors;
}
