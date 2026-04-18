// Learn split cheat sheet: ./STRUCTURE_VS_CONTENT.md
export { KIND_MAP, type SlideKind } from "./kind-map";
export { KIND_RULES, type KindRule } from "./kind-rules";
export { compileLearnSplitToDeck } from "./compile-learn-split";
export { deckOutlineToLearnSplit } from "./outline-to-learn-split";
export { isLearnContentMap, isLearnStructureInput } from "./learn-split-guards";
export {
  mergeStructureAndContent,
  compileMergedOutlineToLandingDeck,
  assertLandingDeckValid,
  translateStructureAndContentToLandingDeck,
  type LearnStructureInput,
  type LearnContentMap,
  type StructureSlide,
} from "./merge-structure-and-content";
