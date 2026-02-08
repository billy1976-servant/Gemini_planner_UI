import type { NormalizedSite } from "@/lib/site-compiler/normalizeSiteData";
import { productsToCardNodes, productsToChipNodes } from "@/lib/site-skin/mappers/productToMoleculeNodes";

/**
 * Build a deterministic data bag for SiteSkin slot resolution.
 * Engines can further narrow/shape this payload, but this file stays pure.
 */
export function siteDataToSlots(siteData: NormalizedSite) {
  const products = Array.isArray(siteData?.products) ? siteData.products : [];

  return {
    products: {
      cards: productsToCardNodes(products),
      chips: productsToChipNodes(products),
    },
  };
}

