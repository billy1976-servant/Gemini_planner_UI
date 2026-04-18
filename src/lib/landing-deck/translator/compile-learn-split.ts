import type { CompileLearnAuthoringResult } from "@/lib/landing-deck/authoring/compile-learn-authoring";
import { compileLearnAuthoringToDeck } from "@/lib/landing-deck/authoring/compile-learn-authoring";
import type { KindRule } from "./kind-rules";
import { KIND_RULES } from "./kind-rules";
import { mergeStructureAndContent, type LearnContentMap, type LearnStructureInput } from "./merge-structure-and-content";
import type { SlideKind } from "./kind-map";

/** Merge structure + content → `LandingDeckV1` with full learn authoring validation. */
export function compileLearnSplitToDeck(
  structure: LearnStructureInput,
  content: LearnContentMap,
  rules: Record<SlideKind, KindRule> = KIND_RULES
): CompileLearnAuthoringResult {
  const outline = mergeStructureAndContent(structure, content, rules);
  return compileLearnAuthoringToDeck(outline);
}
