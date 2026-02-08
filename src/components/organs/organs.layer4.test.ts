/**
 * Layer 4 test: Features-grid, Gallery, Testimonials organs
 *
 * Asserts:
 * 1. Features-grid organ has 4 variants; each expands to Section with role features.
 * 2. Gallery organ has 4 variants; each expands to Section with role gallery.
 * 3. Testimonials organ has 4 variants; each expands to Section with role testimonials.
 * 4. loadOrganVariant returns correct variant for features-grid, gallery, testimonials.
 * 5. Skin with features + gallery + testimonials organs expands to compound-only tree.
 *
 * Run: npm run test:organs:layer4
 */

import { expandOrgansInDocument } from "./resolve-organs";
import { loadOrganVariant } from "./organ-registry";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Layer 4 test failed: ${message}`);
  }
}

function collectTypes(node: unknown, types: string[]): void {
  if (!node || typeof node !== "object") return;
  const n = node as { type?: string; role?: string; children?: unknown[] };
  if (typeof n.type === "string") types.push(n.type.toLowerCase());
  if (Array.isArray(n.children)) n.children.forEach((c) => collectTypes(c, types));
}

const FEATURES_GRID_VARIANTS = ["2-col", "3-col", "4-col", "repeater"];
const GALLERY_VARIANTS = ["grid-2", "grid-3", "grid-4", "carousel-ready"];
const TESTIMONIALS_VARIANTS = ["grid-3", "grid-2", "single-featured", "carousel-ready"];

// --- 1. Features-grid organ: all variants expand to Section with role features
for (const variantId of FEATURES_GRID_VARIANTS) {
  const root = loadOrganVariant("features-grid", variantId);
  assert(root != null, `loadOrganVariant('features-grid','${variantId}') should return variant`);
  const r = root as { type?: string; role?: string };
  assert(r.type === "Section", `features-grid variant '${variantId}' root should be type Section`);
  assert(r.role === "features", `features-grid variant '${variantId}' root should have role features`);
}

// --- 2. Gallery organ: all variants expand to Section with role gallery
for (const variantId of GALLERY_VARIANTS) {
  const root = loadOrganVariant("gallery", variantId);
  assert(root != null, `loadOrganVariant('gallery','${variantId}') should return variant`);
  const r = root as { type?: string; role?: string };
  assert(r.type === "Section", `gallery variant '${variantId}' root should be type Section`);
  assert(r.role === "gallery", `gallery variant '${variantId}' root should have role gallery`);
}

// --- 3. Testimonials organ: all variants expand to Section with role testimonials
for (const variantId of TESTIMONIALS_VARIANTS) {
  const root = loadOrganVariant("testimonials", variantId);
  assert(root != null, `loadOrganVariant('testimonials','${variantId}') should return variant`);
  const r = root as { type?: string; role?: string };
  assert(r.type === "Section", `testimonials variant '${variantId}' root should be type Section`);
  assert(r.role === "testimonials", `testimonials variant '${variantId}' root should have role testimonials`);
}

// --- 4. loadOrganVariant fallbacks: features-grid default, gallery default, testimonials default
assert(loadOrganVariant("features-grid", "default") != null, "features-grid default should exist (3-col)");
assert(loadOrganVariant("gallery", "default") != null, "gallery default should exist (grid-3)");
assert(loadOrganVariant("testimonials", "default") != null, "testimonials default should exist (grid-3)");

// --- 5. Skin with features + gallery + testimonials organs expands to compound-only tree
const skinWithLayer4 = {
  meta: { domain: "test", pageId: "layer4", version: 1 },
  nodes: [
    { type: "organ", organId: "features-grid", variant: "3-col", role: "features" },
    { type: "organ", organId: "gallery", variant: "grid-4", role: "gallery" },
    { type: "organ", organId: "testimonials", variant: "single-featured", role: "testimonials" },
  ],
};
const expanded = expandOrgansInDocument(skinWithLayer4 as any, loadOrganVariant);
const nodes = (expanded as any).nodes as unknown[];
assert(nodes.length === 3, "expanded skin should have 3 nodes");

const first = nodes[0] as { type?: string; role?: string };
const second = nodes[1] as { type?: string; role?: string };
const third = nodes[2] as { type?: string; role?: string };
assert(first.type === "Section" && first.role === "features", "first node should be expanded features Section");
assert(second.type === "Section" && second.role === "gallery", "second node should be expanded gallery Section");
assert(third.type === "Section" && third.role === "testimonials", "third node should be expanded testimonials Section");

const allTypes: string[] = [];
nodes.forEach((n) => collectTypes(n, allTypes));
assert(!allTypes.includes("organ"), "expanded skin must contain no 'organ' type");
assert(allTypes.includes("section"), "tree should contain Section");
assert(allTypes.includes("grid"), "tree should contain Grid (layout molecule)");

console.log("Layer 4 test: all assertions passed.");
process.exit(0);
