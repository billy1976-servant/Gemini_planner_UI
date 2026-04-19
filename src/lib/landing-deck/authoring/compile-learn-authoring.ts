import { compileOutlineToLandingDeck } from "@/lib/landing-deck/outline/compile-outline-to-deck";
import type { DeckOutline } from "@/lib/landing-deck/outline/types";
import type { LandingDeckV1 } from "@/lib/landing-deck/schema";
import { formatValidationReport, validateLandingDeck } from "@/lib/landing-deck/validate-landing-deck";
import { LEARN_DECK_SCHEMA_VERSION, validateLearnAuthoringContracts } from "./learn-authoring-contracts";
import { validateLearnAuthoringV1 } from "./validate-learn-authoring-v1";

export type CompileLearnAuthoringResult =
  | { ok: true; deck: LandingDeckV1 }
  | { ok: false; errors: string[]; report?: string };

/** Compile hidden outline → `LandingDeckV1` with v1 + structural validation. */
export function compileLearnAuthoringToDeck(outline: DeckOutline): CompileLearnAuthoringResult {
  const authoringErrors = [
    ...validateLearnAuthoringV1(outline),
    ...validateLearnAuthoringContracts(outline),
  ];
  if (authoringErrors.length > 0) {
    return { ok: false, errors: authoringErrors };
  }
  const deck: LandingDeckV1 = {
    ...compileOutlineToLandingDeck(outline),
    learnDeckSchemaVersion: LEARN_DECK_SCHEMA_VERSION,
  };
  const issues = validateLandingDeck(deck, { pathLabel: "learn-authoring-compile" });
  const errors = issues.filter((i) => i.severity === "error");
  if (errors.length > 0) {
    return {
      ok: false,
      errors: errors.map((e) => `${e.path}: ${e.message}`),
      report: formatValidationReport(issues),
    };
  }
  return { ok: true, deck };
}
