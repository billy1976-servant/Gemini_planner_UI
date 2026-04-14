/**
 * Slide builder recipes — unit tests.
 * Run: npx ts-node -r tsconfig-paths/register src/lib/slide-builder-recipes.test.ts
 */

import {
  applySlideRecipe,
  applyStylePreset,
  inferSlideTypeFromNode,
  inferStylePresetFromNode,
} from "./slide-builder-recipes";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`slide-builder-recipes test failed: ${message}`);
}

const stub = { content: [{ type: "paragraph", text: "Edit this slide." }] as Array<Record<string, unknown>> };

// applySlideRecipe — hook layout + presentation
const hookPatch = applySlideRecipe("hook", { ...stub, builderMeta: { stylePreset: "compactInfo" } });
assert(hookPatch.layout === "hero", "hook → hero");
assert(hookPatch.lightTheme === true, "hook → lightTheme");
assert(hookPatch.visualTone === "soft", "hook → soft tone");
assert(hookPatch.builderMeta?.stylePreset === "compactInfo", "preserves style preset in meta");
assert(Array.isArray(hookPatch.content) && hookPatch.content.length > 0, "stub content replaced with template");

// applySlideRecipe — does not wipe body when real content
const realContent = {
  content: [{ type: "paragraph", text: "Keep me." }],
  builderMeta: {},
};
const teachingPatch = applySlideRecipe("teaching", realContent);
assert(teachingPatch.layout === "twoCol", "teaching → twoCol");
assert(teachingPatch.content === undefined, "non-stub content preserved (no content in patch)");

// applySlideRecipe — replaceBody forces template
const forced = applySlideRecipe("summary", realContent, { replaceBody: true });
assert(Array.isArray(forced.content), "replaceBody adds template content");

// applySlideRecipe — custom
const customPatch = applySlideRecipe("custom", { content: [], builderMeta: { stylePreset: "actionCta" } });
assert(customPatch.layout === undefined, "custom does not set layout");
assert(customPatch.builderMeta?.slideType === "custom", "custom meta");

// applyStylePreset
const bold = applyStylePreset("boldProof", { slideType: "proof" });
assert(bold.lightTheme === false, "boldProof dark chrome");
assert(bold.visualTone === "bold", "boldProof tone");
assert(bold.builderMeta?.slideType === "proof", "preserves slide type in meta");

const compact = applyStylePreset("compactInfo");
assert(compact.density === "compact", "compactInfo density");

// inferSlideTypeFromNode
assert(
  inferSlideTypeFromNode({ builderMeta: { slideType: "hook" }, layout: "textOnly" }) === "hook",
  "saved slideType wins"
);
assert(inferSlideTypeFromNode({ layout: "proofPanel", content: [] }) === "proof", "layout proof");
assert(
  inferSlideTypeFromNode({
    layout: "textOnly",
    content: [{ type: "comparison", rows: [] }],
  }) === "comparison",
  "comparison block"
);

// inferStylePresetFromNode
assert(
  inferStylePresetFromNode({ builderMeta: { stylePreset: "cleanLight" }, lightTheme: false }) === "cleanLight",
  "saved preset wins"
);

console.log("slide-builder-recipes: all assertions passed");
