/**
 * Universal TXT authoring (blueprint.txt + content.txt).
 * Target-specific compilation lives under `profiles/<target>/`.
 */
export {
  buildIdMaps,
  normalizeTxtAuthoringRawId,
  parseBlueprint,
  parseContent,
  slugify,
  slugifyId,
} from "./parse-blueprint-content";
export type { ParseBlueprintResult, RawNode } from "./parse-blueprint-content";

/** Learn adapter: `blueprint.txt` + `content.txt` → outline / deck (v1 minimal, v2 richer). */
export {
  compileTxtAuthoringToLandingDeckLearnProfileV1,
  compileTxtAuthoringToLandingDeckLearnProfileV2,
  txtAuthoringToDeckOutlineLearnProfileV1,
  txtAuthoringToDeckOutlineLearnProfileV2,
  type TxtProfileLearnV1Options,
  type TxtProfileLearnV2Options,
} from "./profiles/learn";
export {
  loadLearnCompileOptions,
  LEARN_COMPILE_OPTIONS_FILENAME,
} from "./load-learn-compile-options";
