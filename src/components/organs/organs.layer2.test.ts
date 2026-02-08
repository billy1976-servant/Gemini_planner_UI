/**
 * Layer 2 test: Header + Hero organs (early visible wins)
 *
 * Asserts:
 * 1. Header organ has 6 variants; each expands to Section with role header and no "organ" type.
 * 2. Hero organ has 7 variants; each expands to Section with role hero and no "organ" type.
 * 3. loadOrganVariant returns correct variant for header and hero by variantId.
 * 4. Demo skin with header + hero organs expands to compound-only tree (palette/preset ready).
 *
 * Run: npm run test:organs:layer2
 */

import { expandOrgansInDocument } from "./resolve-organs";
import { loadOrganVariant } from "./organ-registry";
import organTestSkin from "@/content/sites/containercreations.com/compiled/skins/organ-test.skin.json";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Layer 2 test failed: ${message}`);
  }
}

function collectTypes(node: unknown, types: string[]): void {
  if (!node || typeof node !== "object") return;
  const n = node as { type?: string; role?: string; children?: unknown[] };
  if (typeof n.type === "string") types.push(n.type.toLowerCase());
  if (Array.isArray(n.children)) n.children.forEach((c) => collectTypes(c, types));
}

const HEADER_VARIANTS = ["default", "sticky-split", "transparent", "minimal", "centered", "full-width"];
const HERO_VARIANTS = ["centered", "image-bg", "split-left", "split-right", "full-screen", "short", "with-cta"];

// --- 1. Header organ: all variants expand to Section with role header
for (const variantId of HEADER_VARIANTS) {
  const root = loadOrganVariant("header", variantId);
  assert(root != null, `loadOrganVariant('header','${variantId}') should return variant`);
  const r = root as { type?: string; role?: string };
  assert(r.type === "Section", `header variant '${variantId}' root should be type Section`);
  assert(r.role === "header", `header variant '${variantId}' root should have role header`);
}

// --- 2. Hero organ: all variants expand to Section with role hero
for (const variantId of HERO_VARIANTS) {
  const root = loadOrganVariant("hero", variantId);
  assert(root != null, `loadOrganVariant('hero','${variantId}') should return variant`);
  const r = root as { type?: string; role?: string };
  assert(r.type === "Section", `hero variant '${variantId}' root should be type Section`);
  assert(r.role === "hero", `hero variant '${variantId}' root should have role hero`);
}

// --- 3. loadOrganVariant fallback: hero default = centered
const heroDefault = loadOrganVariant("hero", "default");
assert(heroDefault != null, "hero default should exist");
assert((heroDefault as { role?: string }).role === "hero", "hero default should have role hero");

// --- 4. Demo skin: header + hero organs expand to compound-only tree
const demoSkinExpanded = expandOrgansInDocument(organTestSkin as any, loadOrganVariant);
const demoNodes = (demoSkinExpanded as any).nodes as unknown[];
assert(demoNodes.length >= 2, "demo skin should have at least header and hero nodes");

const first = demoNodes[0] as { type?: string; role?: string };
const second = demoNodes[1] as { type?: string; role?: string };
assert(first.type === "Section" && first.role === "header", "first node should be expanded header Section");
assert(second.type === "Section" && second.role === "hero", "second node should be expanded hero Section");

const allTypes: string[] = [];
demoNodes.forEach((n) => collectTypes(n, allTypes));
assert(!allTypes.includes("organ"), "demo skin must contain no 'organ' type after expansion");
assert(allTypes.includes("section"), "tree should contain Section (palette/preset apply to compounds)");

console.log("Layer 2 test: all assertions passed.");
process.exit(0);
