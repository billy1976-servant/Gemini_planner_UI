/**
 * Layer 1 test: Organ foundation
 *
 * Asserts:
 * 1. expandOrgans replaces type:"organ" nodes with the variant compound tree.
 * 2. No node with type "organ" remains after expansion.
 * 3. expandOrgansInDocument expands both doc.nodes and doc.regions[].nodes.
 * 4. loadOrganVariant returns the header default variant and null for unknown.
 * 5. Demo skin (organ-test.skin.json) expands so JsonRenderer sees only compound nodes.
 *
 * Run: npx ts-node -r tsconfig-paths/register src/organs/organs.layer1.test.ts
 * Or: npm run test:organs:layer1
 */

import { expandOrgans, expandOrgansInDocument } from "./resolve-organs";
import { loadOrganVariant } from "./organ-registry";
import organTestSkin from "@/content/sites/containercreations.com/compiled/skins/organ-test.skin.json";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Layer 1 test failed: ${message}`);
  }
}

function collectTypes(node: unknown, types: string[]): void {
  if (!node || typeof node !== "object") return;
  const n = node as { type?: string; children?: unknown[] };
  if (typeof n.type === "string") types.push(n.type.toLowerCase());
  if (Array.isArray(n.children)) n.children.forEach((c) => collectTypes(c, types));
}

// --- 1. loadOrganVariant returns header default and null for unknown
const headerDefault = loadOrganVariant("header", "default");
assert(headerDefault != null, "loadOrganVariant('header','default') should return variant");
assert(
  typeof headerDefault === "object" && (headerDefault as { type?: string }).type === "Section",
  "header default variant root should be type Section"
);
assert(loadOrganVariant("unknown", "default") === null, "unknown organ should return null");

// --- 2. expandOrgans replaces organ node with compound tree; no "organ" remains
const nodesWithOrgan = [
  {
    type: "organ",
    organId: "header",
    variant: "default",
  },
];
const expanded = expandOrgans(nodesWithOrgan, loadOrganVariant);
assert(expanded.length === 1, "expanded should have one root node");
const root = expanded[0] as { type?: string; role?: string; layout?: unknown; children?: unknown[] };
assert(root.type === "Section", "root should be Section after expansion");
assert(root.role === "header", "root should have role header");
assert(root.layout != null, "root should have layout");
assert(Array.isArray(root.children), "root should have children (slots)");

const types: string[] = [];
collectTypes(expanded[0], types);
assert(!types.includes("organ"), "no node with type 'organ' should remain after expansion");
assert(types.includes("section"), "tree should contain Section");

// --- 3. expandOrgansInDocument expands doc.nodes
const docWithNodes = {
  meta: { domain: "test", pageId: "home", version: 1 },
  nodes: [
    { type: "organ", organId: "header", variant: "default" },
    { type: "Section", role: "hero", children: [] },
  ],
};
const docExpanded = expandOrgansInDocument(docWithNodes as any, loadOrganVariant);
const docNodes = (docExpanded as any).nodes as unknown[];
assert(docNodes.length === 2, "doc.nodes length unchanged");
assert((docNodes[0] as { type?: string }).type === "Section", "first node should be expanded to Section");
const docTypes: string[] = [];
docNodes.forEach((n) => collectTypes(n, docTypes));
assert(!docTypes.includes("organ"), "doc.nodes should contain no 'organ' type after expansion");

// --- 4. expandOrgansInDocument expands doc.regions[].nodes
const docWithRegions = {
  meta: { domain: "test", pageId: "page", version: 1 },
  regions: [
    { id: "r1", role: "header", nodes: [{ type: "organ", organId: "header", variant: "default" }] },
  ],
};
const docRegionsExpanded = expandOrgansInDocument(docWithRegions as any, loadOrganVariant);
const regionNodes = (docRegionsExpanded as any).regions[0].nodes as unknown[];
assert(regionNodes.length === 1, "region should have one node after expansion");
assert((regionNodes[0] as { type?: string }).type === "Section", "region node should be expanded to Section");

// --- 5. Demo skin: expandOrgansInDocument produces only compound nodes (no "organ")
const demoSkinExpanded = expandOrgansInDocument(organTestSkin as any, loadOrganVariant);
const demoNodes = (demoSkinExpanded as any).nodes as unknown[];
assert(demoNodes.length >= 1, "demo skin should have nodes");
assert((demoNodes[0] as { type?: string }).type === "Section", "first node after expansion should be Section (organ replaced)");
const demoTypes: string[] = [];
demoNodes.forEach((n) => collectTypes(n, demoTypes));
assert(!demoTypes.includes("organ"), "demo skin must contain no 'organ' type after expansion (JsonRenderer-ready)");

console.log("Layer 1 test: all assertions passed.");
process.exit(0);
