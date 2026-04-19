/**
 * Learn target profile(s): universal TXT → Learn `DeckOutline` / `LandingDeckV1`.
 * v1 = minimal teach panels; v2 = richer slide kinds and `learn.*` keys.
 */
export {
  compileTxtAuthoringToLandingDeckLearnProfileV1,
  txtAuthoringToDeckOutlineLearnProfileV1,
  type TxtProfileLearnV1Options,
} from "./txt-profile-learn-v1";
export {
  compileTxtAuthoringToLandingDeckLearnProfileV2,
  txtAuthoringToDeckOutlineLearnProfileV2,
  type TxtProfileLearnV2Options,
  type TxtProfileSlidePresentationDefaults,
} from "./txt-profile-learn-v2";
