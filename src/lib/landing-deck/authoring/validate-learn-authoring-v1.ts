import type { DeckOutline } from "@/lib/landing-deck/outline/types";
import { BLUEPRINT_REGION_OPTIONS } from "@/lib/landing-deck/outline/blueprint";
import { LANDING_LAYOUT_IDS } from "@/lib/landing-layout-catalog";

const LAYOUT_ID_SET = new Set<string>(LANDING_LAYOUT_IDS as readonly string[]);

/** Deterministic v1 authoring checks before compile/persist. */
export function validateLearnAuthoringV1(outline: DeckOutline): string[] {
  const errors: string[] = [];
  if (!outline.meta?.shopUrl?.trim()) {
    errors.push("Deck needs a shop / continue URL (meta.shopUrl).");
  }
  if (!outline.slides?.length) {
    errors.push("Deck needs at least one slide.");
    return errors;
  }

  for (const slide of outline.slides) {
    const id = slide.id;
    const k = slide.learnSlideType;
    if (k === "quiz") {
      if (!slide.quizSelect?.options?.length) {
        errors.push(`Slide "${id}": quiz needs at least one answer option.`);
      }
      if (!slide.quizSelect?.inputId?.trim()) {
        errors.push(`Slide "${id}": quiz needs an input id.`);
      }
    }
    if (k !== "quiz" && slide.quizSelect != null) {
      errors.push(`Slide "${id}": quiz options are only allowed on quiz slides.`);
    }
    const pres = slide.presentation;
    if (pres?.reveal === "custom") {
      const seq = pres.revealSequence ?? [];
      if (!seq.length) {
        errors.push(
          `Slide "${id}": custom reveal needs a block sequence — pick blocks or use “By block order”.`
        );
      }
    }
    const lo = slide.layoutOverride?.trim();
    if (lo && !LAYOUT_ID_SET.has(lo)) {
      errors.push(
        `Slide "${id}": layoutOverride "${slide.layoutOverride}" is not a known layout — expected one of: ${LANDING_LAYOUT_IDS.join(", ")}.`
      );
    }
    const bp = slide.blueprint;
    if (bp?.mode === "explicit" && bp.activeRegions?.length) {
      const opts = BLUEPRINT_REGION_OPTIONS[slide.templateId];
      const allowed = new Set((opts ?? []).map((o) => o.id));
      if (opts && allowed.size) {
        for (const r of bp.activeRegions) {
          if (!allowed.has(r)) {
            errors.push(
              `Slide "${id}": blueprint region "${r}" is not valid for template "${slide.templateId}".`
            );
          }
        }
      }
    }
  }
  return errors;
}
