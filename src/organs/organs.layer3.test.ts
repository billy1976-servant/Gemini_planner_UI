/**
 * Layer 3 test: Nav, Footer, Content-section organs
 *
 * Asserts:
 * 1. Nav organ has 4 variants; each expands to Section with role nav and no "organ" type.
 * 2. Footer organ has 3 variants; each expands to Section with role footer and no "organ" type.
 * 3. Content-section organ has 4 variants; each expands to Section with role content.
 * 4. loadOrganVariant returns correct variant for nav, footer, content-section.
 * 5. Skin with nav + footer + content-section organs expands to compound-only tree.
 *
 * Run: npm run test:organs:layer3
 */

import { expandOrgans, expandOrgansInDocument } from "./resolve-organs";
import { loadOrganVariant } from "./organ-registry";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Layer 3 test failed: ${message}`);
  }
}

function collectTypes(node: unknown, types: string[]): void {
  if (!node || typeof node !== "object") return;
  const n = node as { type?: string; role?: string; children?: unknown[] };
  if (typeof n.type === "string") types.push(n.type.toLowerCase());
  if (Array.isArray(n.children)) n.children.forEach((c) => collectTypes(c, types));
}

const NAV_VARIANTS = ["default", "dropdown", "mobile-collapse", "centered-links"];
const FOOTER_VARIANTS = ["multi-column", "minimal", "with-newsletter"];
const CONTENT_SECTION_VARIANTS = ["text-only", "media-left", "media-right", "zigzag"];

// --- 1. Nav organ: all variants expand to Section with role nav
for (const variantId of NAV_VARIANTS) {
  const root = loadOrganVariant("nav", variantId);
  assert(root != null, `loadOrganVariant('nav','${variantId}') should return variant`);
  const r = root as { type?: string; role?: string };
  assert(r.type === "Section", `nav variant '${variantId}' root should be type Section`);
  assert(r.role === "nav", `nav variant '${variantId}' root should have role nav`);
}

// --- 2. Footer organ: all variants expand to Section with role footer
for (const variantId of FOOTER_VARIANTS) {
  const root = loadOrganVariant("footer", variantId);
  assert(root != null, `loadOrganVariant('footer','${variantId}') should return variant`);
  const r = root as { type?: string; role?: string };
  assert(r.type === "Section", `footer variant '${variantId}' root should be type Section`);
  assert(r.role === "footer", `footer variant '${variantId}' root should have role footer`);
}

// --- 3. Content-section organ: all variants expand to Section with role content
for (const variantId of CONTENT_SECTION_VARIANTS) {
  const root = loadOrganVariant("content-section", variantId);
  assert(root != null, `loadOrganVariant('content-section','${variantId}') should return variant`);
  const r = root as { type?: string; role?: string };
  assert(r.type === "Section", `content-section variant '${variantId}' root should be type Section`);
  assert(r.role === "content", `content-section variant '${variantId}' root should have role content`);
}

// --- 4. loadOrganVariant fallbacks: nav default, footer default, content-section default
assert(loadOrganVariant("nav", "default") != null, "nav default should exist");
assert(loadOrganVariant("footer", "default") != null, "footer default should exist (multi-column)");
assert(loadOrganVariant("content-section", "default") != null, "content-section default should exist (text-only)");

// --- 5. Skin with nav + footer + content-section organs expands to compound-only tree
const skinWithLayer3 = {
  meta: { domain: "test", pageId: "layer3", version: 1 },
  nodes: [
    { type: "organ", organId: "nav", variant: "default", role: "nav" },
    { type: "organ", organId: "content-section", variant: "text-only", role: "content" },
    { type: "organ", organId: "footer", variant: "minimal", role: "footer" },
  ],
};
const expanded = expandOrgansInDocument(skinWithLayer3 as any, loadOrganVariant);
const nodes = (expanded as any).nodes as unknown[];
assert(nodes.length === 3, "expanded skin should have 3 nodes");

const first = nodes[0] as { type?: string; role?: string };
const second = nodes[1] as { type?: string; role?: string };
const third = nodes[2] as { type?: string; role?: string };
assert(first.type === "Section" && first.role === "nav", "first node should be expanded nav Section");
assert(second.type === "Section" && second.role === "content", "second node should be expanded content-section Section");
assert(third.type === "Section" && third.role === "footer", "third node should be expanded footer Section");

const allTypes: string[] = [];
nodes.forEach((n) => collectTypes(n, allTypes));
assert(!allTypes.includes("organ"), "expanded skin must contain no 'organ' type");

// --- 6. expandOrgans replaces single organ node with Section subtree
const singleNav = expandOrgans([{ type: "organ", organId: "nav", variant: "centered-links" }], loadOrganVariant);
assert(singleNav.length === 1, "single organ should expand to one root");
assert((singleNav[0] as { type?: string }).type === "Section", "expanded root should be Section");

console.log("Layer 3 test: all assertions passed.");
process.exit(0);
