/**
 * Layer 7 test: Documentation and validation
 *
 * Asserts:
 * 1. Every organ variant JSON uses only allowed types (Registry + "slot").
 * 2. Validator runs over all manifests and all variants pass.
 * 3. No invalid types in any variant tree.
 *
 * Run: npm run test:organs:layer7
 */

import { validateAllVariants } from "./validate-variants";

import headerManifest from "./header/manifest.json";
import heroManifest from "./hero/manifest.json";
import navManifest from "./nav/manifest.json";
import footerManifest from "./footer/manifest.json";
import contentSectionManifest from "./content-section/manifest.json";
import featuresGridManifest from "./features-grid/manifest.json";
import galleryManifest from "./gallery/manifest.json";
import testimonialsManifest from "./testimonials/manifest.json";
import pricingManifest from "./pricing/manifest.json";
import faqManifest from "./faq/manifest.json";
import ctaManifest from "./cta/manifest.json";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Layer 7 test failed: ${message}`);
  }
}

type ManifestWithVariants = { id: string; variantIds: string[] };

const ORGAN_MANIFESTS: ManifestWithVariants[] = [
  headerManifest as ManifestWithVariants,
  heroManifest as ManifestWithVariants,
  navManifest as ManifestWithVariants,
  footerManifest as ManifestWithVariants,
  contentSectionManifest as ManifestWithVariants,
  featuresGridManifest as ManifestWithVariants,
  galleryManifest as ManifestWithVariants,
  testimonialsManifest as ManifestWithVariants,
  pricingManifest as ManifestWithVariants,
  faqManifest as ManifestWithVariants,
  ctaManifest as ManifestWithVariants,
];

// --- 1. Validate all organ variants: every node type must be Registry or "slot"
const results = validateAllVariants(ORGAN_MANIFESTS);

// --- 2. All variants must pass
const failed = results.filter((r): r is { ok: false; organId: string; variantId: string; invalidTypes: string[] } => !r.ok);
assert(failed.length === 0, `Validator failed for: ${failed.map((r) => `${r.organId}/${r.variantId} (invalid types: ${r.invalidTypes.join(", ")})`).join("; ")}`);

// --- 3. No invalid types in any variant tree (enforced by 2)
const totalVariants = results.length;
assert(totalVariants >= 1, "At least one variant must be validated");

console.log("Layer 7 test: all assertions passed.");
console.log(`Validated ${totalVariants} organ variants (allowed types only).`);
process.exit(0);
