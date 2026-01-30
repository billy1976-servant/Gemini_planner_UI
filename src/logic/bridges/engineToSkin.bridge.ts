import type { NormalizedSite } from "@/lib/site-compiler/normalizeSiteData";
import type { SiteSkinDocument } from "@/lib/site-skin/siteSkin.types";
import { siteDataToSlots } from "@/lib/site-skin/mappers/siteDataToSlots";
import { applySkinBindings } from "@/logic/bridges/skinBindings.apply";

export type EngineOutput = Record<string, any>;

/**
 * Build a pure JSON data bag for SiteSkin slot resolution.
 *
 * Rules:
 * - Engines decide *what* to include/feature; mappers decide *how* to render.
 * - JSON skin decides *where* it appears (slots in regions).
 */
export function buildSiteSkinDataBag(args: {
  siteData: NormalizedSite;
  engineOutput?: EngineOutput;
}) {
  const { siteData, engineOutput } = args;
  return {
    ...siteDataToSlots(siteData),
    site: siteData,
    engine: engineOutput ?? {},
  };
}

/**
 * Convenience helper: apply bindings to a skin using the standard data bag.
 * Returns a skin document with all slots resolved (renderable by JsonRenderer).
 */
export function resolveSiteSkin(args: {
  skin: SiteSkinDocument;
  siteData: NormalizedSite;
  engineOutput?: EngineOutput;
}) {
  const dataBag = buildSiteSkinDataBag({ siteData: args.siteData, engineOutput: args.engineOutput });
  const resolvedSkin = applySkinBindings(args.skin, dataBag);
  return { dataBag, resolvedSkin };
}

