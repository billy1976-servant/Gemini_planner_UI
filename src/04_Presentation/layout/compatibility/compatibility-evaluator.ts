/**
 * Compatibility Evaluator: compares required slots (from registry) vs available
 * slots (from content extractor) and returns a compatibility result.
 * Pure function; no side effects.
 */

import { getAvailableSlots, type SectionNode } from "./content-capability-extractor";
import {
  getRequiredSlots,
  getRequiredSlotsForOrgan,
} from "./requirement-registry";

export type CompatibilityResult = {
  sectionValid: boolean;
  cardValid: boolean;
  /** Present when section has an organ role; omitted otherwise. */
  organValid?: boolean;
  /** Union of missing slots across section, card, and organ. */
  missing: string[];
};

export type EvaluateCompatibilityArgs = {
  sectionNode: SectionNode | null | undefined;
  sectionLayoutId?: string | null;
  cardLayoutId?: string | null;
  /** Section role (e.g. hero, features-grid); used when evaluating organ internal layout. */
  organId?: string | null;
  organInternalLayoutId?: string | null;
  /** When true, force cardValid to true (e.g. for preview tiles so layout override always renders). */
  forceCardValid?: boolean;
};

/**
 * Evaluates whether the selected section, card, and organ internal layouts
 * are compatible with the section's content. Returns a result object only;
 * does not read or write any stores.
 */
export function evaluateCompatibility(args: EvaluateCompatibilityArgs): CompatibilityResult {
  const {
    sectionNode,
    sectionLayoutId,
    cardLayoutId,
    organId,
    organInternalLayoutId,
    forceCardValid = false,
  } = args;

  const availableSlotsList = getAvailableSlots(sectionNode ?? undefined);
  const availableSet = new Set(availableSlotsList);
  const missing: string[] = [];

  const sectionLayoutIdTrimmed = (sectionLayoutId ?? "").toString().trim();
  const sectionRequired = getRequiredSlots("section", sectionLayoutIdTrimmed);
  const sectionValid =
    sectionRequired.length === 0 ||
    sectionRequired.every((s) => availableSet.has(s));
  if (!sectionValid) {
    for (const s of sectionRequired) {
      if (!availableSet.has(s)) missing.push(s);
    }
  }

  const cardLayoutIdTrimmed = (cardLayoutId ?? "").toString().trim();
  const cardRequired = getRequiredSlots("card", cardLayoutIdTrimmed);
  const cardMissing = cardRequired.filter((s) => !availableSet.has(s));
  let cardValid =
    cardRequired.length === 0 || cardRequired.every((s) => availableSet.has(s));
  if (forceCardValid) {
    cardValid = true;
  }
  // TEMP: Layout preview diagnostic — bypass card compatibility when env is set so preview tiles show different layouts (prove whether cardValid false was masking layout overrides). Do NOT remove; gate by NEXT_PUBLIC_LAYOUT_DEBUG only.
  if (
    typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_LAYOUT_DEBUG === "true"
  ) {
    cardValid = true;
  }
  if (!cardValid) {
    for (const s of cardRequired) {
      if (!availableSet.has(s)) missing.push(s);
    }
    // Dev-only: diagnose over-aggressive card filtering (plan step 4)
    if (
      typeof process !== "undefined" &&
      process.env.NODE_ENV === "development" &&
      cardRequired.length > 0
    ) {
      const sectionKey = (sectionNode as SectionNode & { id?: string; role?: string })?.id ?? (sectionNode as SectionNode & { role?: string })?.role ?? "(no key)";
      console.log("[compatibility-evaluator] cardValid false", {
        cardLayoutId: cardLayoutId ?? "(empty)",
        cardRequired,
        availableSlots: availableSlotsList,
        missing: cardMissing,
        missingSlot: cardMissing[0] ?? "(none)",
        sectionKey,
        sectionLayoutId: sectionLayoutIdTrimmed || "(empty)",
        requiredSlotsForSection: sectionRequired,
        requiredSlotsForCard: cardRequired,
      });
    }
  }

  const hasOrgan = organId != null && String(organId).trim() !== "";
  const organInternalId = (organInternalLayoutId ?? "").toString().trim();
  let organValid: boolean | undefined;
  if (hasOrgan && organInternalId) {
    const organRequired = getRequiredSlotsForOrgan(
      String(organId).trim(),
      organInternalId
    );
    organValid =
      organRequired.length === 0 ||
      organRequired.every((s) => availableSet.has(s));
    if (!organValid) {
      for (const s of organRequired) {
        if (!availableSet.has(s)) missing.push(s);
      }
    }
  }

  const uniqueMissing = Array.from(new Set(missing));

  // Dev-only: log requiredSlots per layoutId, actual slots, and which slot is missing (for diagnosis)
  if (
    typeof process !== "undefined" &&
    process.env.NODE_ENV === "development" &&
    (sectionLayoutIdTrimmed || cardLayoutIdTrimmed)
  ) {
    const sectionKey = (sectionNode as SectionNode & { id?: string; role?: string })?.id ?? (sectionNode as SectionNode & { role?: string })?.role ?? "(no key)";
    const missingForCard = cardRequired.filter((s) => !availableSet.has(s));
    console.log("[compatibility-evaluator] slot summary", {
      sectionKey,
      sectionLayoutId: sectionLayoutIdTrimmed || "(empty)",
      requiredSlotsForSection: sectionRequired,
      cardLayoutId: cardLayoutIdTrimmed || "(empty)",
      requiredSlotsForCard: cardRequired,
      actualSlotsInSection: availableSlotsList,
      missingSlotForCard: missingForCard.length > 0 ? missingForCard : undefined,
      cardValid,
    });
  }

  return {
    sectionValid,
    cardValid,
    ...(hasOrgan ? { organValid } : {}),
    missing: uniqueMissing,
  };
}
