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
  } = args;

  const availableSet = new Set(
    getAvailableSlots(sectionNode ?? undefined)
  );
  const missing: string[] = [];

  const sectionRequired = getRequiredSlots(
    "section",
    (sectionLayoutId ?? "").toString().trim()
  );
  const sectionValid =
    sectionRequired.length === 0 ||
    sectionRequired.every((s) => availableSet.has(s));
  if (!sectionValid) {
    for (const s of sectionRequired) {
      if (!availableSet.has(s)) missing.push(s);
    }
  }

  const cardRequired = getRequiredSlots(
    "card",
    (cardLayoutId ?? "").toString().trim()
  );
  const cardValid =
    cardRequired.length === 0 || cardRequired.every((s) => availableSet.has(s));
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
      const availableSlots = Array.from(availableSet);
      console.log("[compatibility-evaluator] cardValid false", {
        cardLayoutId: cardLayoutId ?? "(empty)",
        cardRequired,
        availableSlots,
        missing: cardRequired.filter((s) => !availableSet.has(s)),
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

  return {
    sectionValid,
    cardValid,
    ...(hasOrgan ? { organValid } : {}),
    missing: uniqueMissing,
  };
}
