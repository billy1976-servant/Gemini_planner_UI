/**
 * Optional per-folder compiler config for TXT → Learn (not part of `content.txt`).
 * Place `learn.compile-options.json` next to `blueprint.txt` to set profile defaults.
 */
import fs from "fs";
import path from "path";
import type { TxtProfileLearnV2Options } from "./profiles/learn/txt-profile-learn-v2";

export const LEARN_COMPILE_OPTIONS_FILENAME = "learn.compile-options.json";

function isRecord(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === "object" && !Array.isArray(v);
}

function parseSlidePresentationDefaults(
  raw: unknown
): TxtProfileLearnV2Options["slidePresentationDefaults"] | undefined {
  if (!isRecord(raw)) return undefined;
  const visualTone = raw.visualTone;
  const density = raw.density;
  const lightTheme = raw.lightTheme;
  const out: NonNullable<TxtProfileLearnV2Options["slidePresentationDefaults"]> = {};
  if (visualTone === "default" || visualTone === "soft" || visualTone === "bold") {
    out.visualTone = visualTone;
  }
  if (density === "comfortable" || density === "compact") {
    out.density = density;
  }
  if (typeof lightTheme === "boolean") {
    out.lightTheme = lightTheme;
  }
  return Object.keys(out).length ? out : undefined;
}

/**
 * Parses optional `learn.compile-options.json` in `folderAbs`.
 * Unknown keys are ignored; invalid JSON returns `{}`.
 */
export function loadLearnCompileOptions(folderAbs: string): Partial<TxtProfileLearnV2Options> {
  const filePath = path.join(folderAbs, LEARN_COMPILE_OPTIONS_FILENAME);
  if (!fs.existsSync(filePath)) return {};
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const j = JSON.parse(raw) as unknown;
    if (!isRecord(j)) return {};

    const out: Partial<TxtProfileLearnV2Options> = {};
    if (typeof j.shopUrl === "string") out.shopUrl = j.shopUrl;
    if (typeof j.logoSrc === "string") out.logoSrc = j.logoSrc;
    if (typeof j.logoAlt === "string") out.logoAlt = j.logoAlt;
    if (typeof j.shopNowLabel === "string") out.shopNowLabel = j.shopNowLabel;
    if (typeof j.heroLinkLabel === "string") out.heroLinkLabel = j.heroLinkLabel;
    if (typeof j.stepTrackerTitle === "string") out.stepTrackerTitle = j.stepTrackerTitle;
    if (typeof j.stepTrackerDescription === "string") out.stepTrackerDescription = j.stepTrackerDescription;
    if (typeof j.deckPalette === "string") out.deckPalette = j.deckPalette;
    if (typeof j.showResponses === "boolean") out.showResponses = j.showResponses;
    if (typeof j.responsePlaceholder === "string") out.responsePlaceholder = j.responsePlaceholder;
    if (typeof j.allowOrgans === "boolean") out.allowOrgans = j.allowOrgans;

    const spd = parseSlidePresentationDefaults(j.slidePresentationDefaults);
    if (spd) out.slidePresentationDefaults = spd;

    return out;
  } catch {
    return {};
  }
}
