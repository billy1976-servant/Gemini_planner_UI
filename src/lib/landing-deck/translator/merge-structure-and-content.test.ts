/**
 * Golden tests for structure + content → DeckOutline → LandingDeckV1 translator.
 */
import assert from "assert";
import { mergeStructureAndContent, translateStructureAndContentToLandingDeck } from "./merge-structure-and-content";
import type { LearnContentMap, LearnStructureInput } from "./merge-structure-and-content";
import { validateLandingDeck } from "@/lib/landing-deck/validate-landing-deck";

function formatIssues(issues: { path: string; message: string; severity: string }[]): string {
  return issues.map((i) => `${i.severity} ${i.path}: ${i.message}`).join("\n");
}

const baseStructure: LearnStructureInput = {
  meta: {
    title: "Demo",
    shopUrl: "https://example.com",
    logoSrc: "/favicon.ico",
    logoAlt: "Demo",
  },
  slides: [
    { id: "s1", kind: "hero" },
    { id: "s2", kind: "teach" },
    { id: "s3", kind: "quiz" },
    { id: "s4", kind: "summary" },
  ],
};

const baseContent: LearnContentMap = {
  s1: { title: "Hello", paragraphs: ["Hook line."] },
  s2: { title: "Teach", bullets: ["A", "B"], presentation: { reveal: "none" } },
  s3: {
    title: "Pick one",
    quizSelect: {
      inputId: "q1",
      options: [
        { value: "a", label: "A" },
        { value: "b", label: "B" },
      ],
    },
  },
  s4: { title: "Done", paragraphs: ["Thanks."] },
};

function run() {
  const outline = mergeStructureAndContent(baseStructure, baseContent);
  assert.strictEqual(outline.slides.length, 4);
  assert.strictEqual(outline.slides[0].templateId, "heroHook");
  assert.strictEqual(outline.slides[1].templateId, "teachingStamped");
  assert.strictEqual(outline.slides[2].templateId, "quizSelectStamped");
  assert.strictEqual(outline.slides[2].quizSelect?.inputId, "q1");
  assert.strictEqual(outline.slides[3].templateId, "summaryTextOnly");

  const deck = translateStructureAndContentToLandingDeck(baseStructure, baseContent);
  assert.strictEqual(deck.screens.length, 4);
  assert.strictEqual(deck.screens[1].presentation?.reveal, "none");
  const issues = validateLandingDeck(deck, { pathLabel: "translator-test" });
  assert.strictEqual(
    issues.filter((i) => i.severity === "error").length,
    0,
    formatIssues(issues)
  );

  assert.throws(() => mergeStructureAndContent(baseStructure, { ...baseContent, orphan: {} } as LearnContentMap), /Unknown content id/);

  assert.throws(
    () =>
      mergeStructureAndContent(baseStructure, {
        ...baseContent,
        s2: { title: "x", quizSelect: { inputId: "i", options: [{ value: "a", label: "A" }] } },
      }),
    /disallowed content key .*quizSelect/
  );

  assert.throws(
    () =>
      mergeStructureAndContent(baseStructure, {
        ...baseContent,
        s3: {
          quizSelect: {
            inputId: "q1",
            options: [{ value: "a", label: "A" }],
          },
          bullets: ["nope"],
        },
      }),
    /bullets/
  );

  console.log("merge-structure-and-content.test.ts OK");
}

run();
