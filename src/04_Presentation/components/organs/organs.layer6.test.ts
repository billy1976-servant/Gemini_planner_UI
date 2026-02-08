/**
 * Layer 6 test: Variant libraries (Wix-level breadth)
 *
 * Asserts:
 * 1. Manifest variantIds is authoritative: every variantId in each organ's manifest
 *    loads via loadOrganVariant(organId, variantId).
 * 2. Header organ has >= 10 variants (Wix-level breadth).
 * 3. All organs have at least 2 variants.
 * 4. Registry and manifests stay in sync (no missing variants).
 *
 * Run: npm run test:organs:layer6
 */

import { loadOrganVariant } from "./organ-registry";

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
    throw new Error(`Layer 6 test failed: ${message}`);
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

// --- 1. Manifest variantIds is authoritative: every variantId loads
for (const manifest of ORGAN_MANIFESTS) {
  const organId = manifest.id;
  const variantIds = Array.isArray(manifest.variantIds) ? manifest.variantIds : [];
  assert(variantIds.length >= 1, `Organ '${organId}' must have at least one variant in manifest.variantIds`);
  for (const variantId of variantIds) {
    const root = loadOrganVariant(organId, variantId);
    assert(
      root != null,
      `loadOrganVariant('${organId}','${variantId}') must return variant (manifest is authoritative)`
    );
    const r = root as { type?: string };
    assert(r.type === "Section", `Variant '${organId}/${variantId}' root must be type Section`);
  }
}

// --- 2. Header organ has >= 10 variants (Wix-level breadth)
const headerVariants = (headerManifest as ManifestWithVariants).variantIds;
assert(
  headerVariants.length >= 10,
  `Header organ must have >= 10 variants for Wix-level breadth (got ${headerVariants.length})`
);

// --- 3. All organs have at least 2 variants
for (const manifest of ORGAN_MANIFESTS) {
  const count = Array.isArray(manifest.variantIds) ? manifest.variantIds.length : 0;
  assert(count >= 2, `Organ '${manifest.id}' must have >= 2 variants (got ${count})`);
}

// --- 4. Registry and manifests in sync (already enforced by 1: every manifest variantId must load)
console.log("Layer 6 test: all assertions passed.");
console.log("Variant counts:", ORGAN_MANIFESTS.map((m) => `${m.id}: ${(m.variantIds || []).length}`).join(", "));
process.exit(0);
