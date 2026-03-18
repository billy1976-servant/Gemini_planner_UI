/**
 * Experience visibility filter contract tests.
 * Run: npx ts-node -r tsconfig-paths/register src/03_Runtime/engine/core/experience-visibility.test.ts
 */

import { getExperienceVisibility } from "./experience-visibility";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`experience-visibility test: ${message}`);
}

const sectionKeys = ["hero", "content"];

// website: always render
assert(getExperienceVisibility("website", { type: "Section", id: "hero" }, 1, 0, sectionKeys) === "render", "website section render");
assert(getExperienceVisibility("website", { type: "div" }, 2, 0, []) === "render", "website any node render");

// app: depth 0 render; depth 1 sections — one expanded (activeSectionKey), rest collapsed
assert(getExperienceVisibility("app", { type: "Screen" }, 0, 0, sectionKeys) === "render", "app root render");
assert(getExperienceVisibility("app", { type: "Section", id: "hero" }, 1, 0, sectionKeys) === "render", "app first section render when default active");
assert(getExperienceVisibility("app", { type: "Section", id: "content" }, 1, 0, sectionKeys) === "collapse", "app second section collapse when default active");
assert(getExperienceVisibility("app", { type: "Section", id: "content" }, 1, 0, sectionKeys, "content") === "render", "app second section render when activeSectionKey=content");
assert(getExperienceVisibility("app", { type: "Section", id: "hero" }, 1, 0, sectionKeys, "content") === "collapse", "app first section collapse when activeSectionKey=content");
assert(getExperienceVisibility("app", { type: "Card" }, 1, 0, sectionKeys) === "hide", "app non-section at depth 1 hide");
assert(getExperienceVisibility("app", { type: "Card" }, 2, 0, sectionKeys) === "render", "app depth 2 render");

// learning: only section at stepIndex at depth 1
assert(getExperienceVisibility("learning", {}, 0, 0, sectionKeys) === "render", "learning root render");
assert(getExperienceVisibility("learning", { type: "Section", id: "hero" }, 1, 0, sectionKeys) === "render", "learning first section render");
assert(getExperienceVisibility("learning", { type: "Section", id: "content" }, 1, 0, sectionKeys) === "hide", "learning second section hide when step 0");
assert(getExperienceVisibility("learning", { type: "Section", id: "content" }, 1, 1, sectionKeys) === "render", "learning second section render when step 1");
assert(getExperienceVisibility("learning", { type: "Card" }, 1, 0, ["hero"]) === "hide", "learning non-section at depth 1 hide");
assert(getExperienceVisibility("learning", { type: "Card" }, 2, 0, ["hero"]) === "render", "learning depth 2 render");

// power modes: focus, presentation, kids
assert(getExperienceVisibility("focus", { type: "Section", id: "hero" }, 1, 0, sectionKeys) === "render", "focus first section render");
assert(getExperienceVisibility("presentation", { type: "Section", id: "content" }, 1, 1, sectionKeys) === "render", "presentation step 1 render");
assert(getExperienceVisibility("kids", { type: "Section" }, 2, 0, []) === "render", "kids depth 2 render");
assert(getExperienceVisibility("kids", { type: "Card" }, 3, 0, []) === "hide", "kids depth 3 hide");

console.log("experience-visibility.test.ts: all checks passed.");
