/**
 * Param Key Mapping Test
 *
 * Asserts definition ↔ contract alignment for molecule params.
 * Prevents regressions from definition/compound param key mismatches
 * that cause unstyled UI (e.g. Button label, Toolbar item, List item, Footer item).
 *
 * Run: npx ts-node -r tsconfig-paths/register src/contracts/param-key-mapping.test.ts
 * Or: npm run test:param-keys
 */

import contract from "./JSON_SCREEN_CONTRACT.json";
import definitions from "@/compounds/ui/index";
import { resolveParams } from "@/engine/core/palette-resolver";
import { resolveToken } from "@/engine/core/palette-resolve-token";
import app1 from "@/apps-offline/apps/journal_track/app-1.json";
import { EXPECTED_PARAMS } from "./expected-params";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Param key mapping test failed: ${message}`);
  }
}

function getFirstVariant(def: any): Record<string, any> {
  if (!def?.variants || typeof def.variants !== "object") return {};
  const keys = Object.keys(def.variants);
  if (keys.length === 0) return {};
  const firstKey = keys.find((k) => k === "default") ?? keys.find((k) => k === "filled") ?? keys[0];
  return def.variants[firstKey] ?? {};
}

function getFirstSize(def: any): Record<string, any> {
  if (!def?.sizes || typeof def.sizes !== "object") return {};
  const keys = Object.keys(def.sizes);
  if (keys.length === 0) return {};
  const firstKey = keys.find((k) => k === "md") ?? keys[0];
  return def.sizes[firstKey] ?? {};
}

// --- 1. Button: definition must have label (not just text)
const buttonDef = (definitions as any).button;
const buttonVariant = getFirstVariant(buttonDef);
assert("label" in buttonVariant, "button definition variants must have 'label' param (contract expects label)");
assert("surface" in buttonVariant, "button definition must have surface");
assert("trigger" in buttonVariant, "button definition must have trigger");

// --- 2. Toolbar: definition must have item (with item.text for TextAtom)
const toolbarDef = (definitions as any).toolbar;
const toolbarVariant = getFirstVariant(toolbarDef);
assert("item" in toolbarVariant, "toolbar definition must have 'item' param (compound expects params.item)");
assert(
  toolbarVariant.item && typeof toolbarVariant.item === "object" && "text" in toolbarVariant.item,
  "toolbar definition item must have 'text' subkey for TextAtom"
);

// --- 3. List: definition must have item
const listDef = (definitions as any).list;
const listVariant = getFirstVariant(listDef);
assert("item" in listVariant, "list definition must have 'item' param (compound expects params.item)");

// --- 4. Footer: definition must have item
const footerDef = (definitions as any).footer;
const footerVariant = getFirstVariant(footerDef);
assert("item" in footerVariant, "footer definition must have 'item' param (compound expects params.item)");

// --- 5. Section: definition must have title
const sectionDef = (definitions as any).section;
const sectionVariant = getFirstVariant(sectionDef);
assert("title" in sectionVariant, "section definition must have title");
assert("surface" in sectionVariant, "section definition must have surface");

// --- 6. Card: definition must have title, body, media
const cardDef = (definitions as any).card;
const cardVariant = getFirstVariant(cardDef);
assert("title" in cardVariant, "card definition must have title");
assert("body" in cardVariant, "card definition must have body");
assert("media" in cardVariant, "card definition must have media");
assert("surface" in cardVariant, "card definition must have surface");

// --- 7. Field: definition must have error (not errorStyle)
const fieldDef = (definitions as any).field;
const fieldVariant = getFirstVariant(fieldDef);
assert("error" in fieldVariant, "field definition must have 'error' param (compound expects params.error)");
assert("label" in fieldVariant, "field definition must have label");

// --- 8. Contract allowedParams includes expected keys for each molecule
const molecules = (contract as any).molecules;
assert(molecules != null, "contract must have molecules");
assert(
  molecules.button?.allowedParams?.includes("label"),
  "contract button allowedParams must include 'label'"
);
assert(
  molecules.toolbar?.allowedParams?.includes("item"),
  "contract toolbar allowedParams must include 'item'"
);
assert(molecules.list?.allowedParams?.includes("item"), "contract list allowedParams must include 'item'");
assert(molecules.footer?.allowedParams?.includes("item"), "contract footer allowedParams must include 'item'");

// --- 9. resolveParams produces expected keys when given definition variant + size
// (simulates JsonRenderer merge: visualPreset, variantPreset, sizePreset, inlineParams)
const buttonMerged = resolveParams({}, buttonVariant, getFirstSize(buttonDef), {});
const buttonKeys = Object.keys(buttonMerged);
assert(buttonKeys.includes("label"), "resolveParams(button) must produce 'label' key");
assert(buttonKeys.includes("surface"), "resolveParams(button) must produce 'surface' key");

const toolbarMerged = resolveParams({}, toolbarVariant, getFirstSize(toolbarDef), {});
const toolbarKeys = Object.keys(toolbarMerged);
assert(toolbarKeys.includes("item"), "resolveParams(toolbar) must produce 'item' key");

const listMerged = resolveParams({}, listVariant, getFirstSize(listDef), {});
const listKeys = Object.keys(listMerged);
assert(listKeys.includes("item"), "resolveParams(list) must produce 'item' key");

const footerMerged = resolveParams({}, footerVariant, {}, {});
const footerKeys = Object.keys(footerMerged);
assert(footerKeys.includes("item"), "resolveParams(footer) must produce 'item' key");

// --- 10. Token resolution: palette tokens resolve to values
const colorPrimary = resolveToken("color.primary");
assert(typeof colorPrimary === "string" && colorPrimary.startsWith("#"), "resolveToken('color.primary') must return hex color");
const textSizeSm = resolveToken("textSize.sm");
assert(typeof textSizeSm === "number" && textSizeSm > 0, "resolveToken('textSize.sm') must return positive number");
const textRoleLabelSize = resolveToken("textRole.label.size");
assert(textRoleLabelSize != null, "resolveToken('textRole.label.size') must resolve (chained token)");

// --- 11. app-1.json structure: screens use valid molecule types
const validTypes = new Set(["Section", "Button", "Card", "Toolbar", "List", "Footer", "Grid", "screen"]);
function collectTypes(node: any, types: string[]): void {
  if (!node || typeof node !== "object") return;
  if (typeof node.type === "string") types.push(node.type);
  if (Array.isArray(node.children)) node.children.forEach((c: any) => collectTypes(c, types));
}
const app1Types: string[] = [];
collectTypes(app1, app1Types);
const invalid = app1Types.filter((t) => !validTypes.has(t));
assert(invalid.length === 0, `app-1.json uses only valid types; found: ${invalid.join(", ") || "none"}`);

console.log("Param key mapping test: all assertions passed.");
process.exit(0);
