/**
 * Layer 5 test: Pricing, FAQ, CTA organs
 *
 * Asserts:
 * 1. Pricing organ has 5 variants; each expands to Section with role pricing.
 * 2. FAQ organ has 3 variants; each expands to Section with role faq.
 * 3. CTA organ has 4 variants; each expands to Section with role cta.
 * 4. loadOrganVariant returns correct variant for pricing, faq, cta.
 * 5. Skin with pricing + faq + cta organs expands to compound-only tree.
 *
 * Run: npm run test:organs:layer5
 */

import { expandOrgansInDocument } from "./resolve-organs";
import { loadOrganVariant } from "./organ-registry";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Layer 5 test failed: ${message}`);
  }
}

function collectTypes(node: unknown, types: string[]): void {
  if (!node || typeof node !== "object") return;
  const n = node as { type?: string; role?: string; children?: unknown[] };
  if (typeof n.type === "string") types.push(n.type.toLowerCase());
  if (Array.isArray(n.children)) n.children.forEach((c) => collectTypes(c, types));
}

const PRICING_VARIANTS = ["2-tier", "3-tier", "4-tier", "highlighted", "minimal"];
const FAQ_VARIANTS = ["accordion", "list", "two-column"];
const CTA_VARIANTS = ["banner", "strip", "split", "full-width"];

// --- 1. Pricing organ: all variants expand to Section with role pricing
for (const variantId of PRICING_VARIANTS) {
  const root = loadOrganVariant("pricing", variantId);
  assert(root != null, `loadOrganVariant('pricing','${variantId}') should return variant`);
  const r = root as { type?: string; role?: string };
  assert(r.type === "Section", `pricing variant '${variantId}' root should be type Section`);
  assert(r.role === "pricing", `pricing variant '${variantId}' root should have role pricing`);
}

// --- 2. FAQ organ: all variants expand to Section with role faq
for (const variantId of FAQ_VARIANTS) {
  const root = loadOrganVariant("faq", variantId);
  assert(root != null, `loadOrganVariant('faq','${variantId}') should return variant`);
  const r = root as { type?: string; role?: string };
  assert(r.type === "Section", `faq variant '${variantId}' root should be type Section`);
  assert(r.role === "faq", `faq variant '${variantId}' root should have role faq`);
}

// --- 3. CTA organ: all variants expand to Section with role cta
for (const variantId of CTA_VARIANTS) {
  const root = loadOrganVariant("cta", variantId);
  assert(root != null, `loadOrganVariant('cta','${variantId}') should return variant`);
  const r = root as { type?: string; role?: string };
  assert(r.type === "Section", `cta variant '${variantId}' root should be type Section`);
  assert(r.role === "cta", `cta variant '${variantId}' root should have role cta`);
}

// --- 4. loadOrganVariant fallbacks: pricing default, faq default, cta default
assert(loadOrganVariant("pricing", "default") != null, "pricing default should exist (3-tier)");
assert(loadOrganVariant("faq", "default") != null, "faq default should exist (accordion)");
assert(loadOrganVariant("cta", "default") != null, "cta default should exist (banner)");

// --- 5. Skin with pricing + faq + cta organs expands to compound-only tree
const skinWithLayer5 = {
  meta: { domain: "test", pageId: "layer5", version: 1 },
  nodes: [
    { type: "organ", organId: "pricing", variant: "3-tier", role: "pricing" },
    { type: "organ", organId: "faq", variant: "accordion", role: "faq" },
    { type: "organ", organId: "cta", variant: "banner", role: "cta" },
  ],
};
const expanded = expandOrgansInDocument(skinWithLayer5 as any, loadOrganVariant);
const nodes = (expanded as any).nodes as unknown[];
assert(nodes.length === 3, "expanded skin should have 3 nodes");

const first = nodes[0] as { type?: string; role?: string };
const second = nodes[1] as { type?: string; role?: string };
const third = nodes[2] as { type?: string; role?: string };
assert(first.type === "Section" && first.role === "pricing", "first node should be expanded pricing Section");
assert(second.type === "Section" && second.role === "faq", "second node should be expanded faq Section");
assert(third.type === "Section" && third.role === "cta", "third node should be expanded cta Section");

const allTypes: string[] = [];
nodes.forEach((n) => collectTypes(n, allTypes));
assert(!allTypes.includes("organ"), "expanded skin must contain no 'organ' type");

console.log("Layer 5 test: all assertions passed.");
process.exit(0);
