/**
 * V2 learn authoring: blueprint activation, rich blocks, regeneration helpers.
 */
import assert from "assert";
import { compileLearnAuthoringToDeck } from "./compile-learn-authoring";
import { validateLearnAuthoringV1 } from "./validate-learn-authoring-v1";
import { clearOutlineSlideRichContent, resetOutlineSlideStructuredBody } from "./regenerate-outline-slide";
import type { DeckOutline } from "@/lib/landing-deck/outline/types";

const withBlueprint: DeckOutline = {
  meta: {
    outlineFormatVersion: 2,
    title: "T",
    shopUrl: "https://example.com",
    stepTrackerTitle: "T",
    stepTrackerDescription: "",
  },
  slides: [
    {
      id: "slide-1",
      learnSlideType: "teach",
      templateId: "teachingStamped",
      title: "Hello",
      blueprint: { mode: "explicit", activeRegions: ["body"] },
      badge: "Hidden by blueprint",
      paragraphs: ["A"],
      richContent: [
        { type: "badge", text: "Also hidden" },
        { type: "paragraph", text: "Visible" },
        { type: "scripture", text: "Text", reference: "Jn 3:16" },
      ],
      inlineMedia: [],
    },
  ],
};

const badRegion: DeckOutline = {
  meta: { title: "T", shopUrl: "https://example.com", stepTrackerTitle: "T", stepTrackerDescription: "" },
  slides: [
    {
      id: "x",
      learnSlideType: "teach",
      templateId: "teachingStamped",
      title: "T",
      blueprint: { mode: "explicit", activeRegions: ["not-a-region"] },
      inlineMedia: [],
    },
  ],
};

function run() {
  const v = validateLearnAuthoringV1(badRegion);
  assert.ok(v.some((m) => m.includes("not-a-region")), v.join("; "));

  const r = compileLearnAuthoringToDeck(withBlueprint);
  assert.strictEqual(r.ok, true);
  if (!r.ok) return;
  const content = r.deck.screens[0].content;
  const types = content.map((b) => (b as { type: string }).type);
  assert.deepStrictEqual(types, ["paragraph", "scripture"]);
  assert.strictEqual(
    (content[0] as { type: string; text?: string }).text,
    "Visible",
    "badge blocks filtered by blueprint"
  );

  const cleared = clearOutlineSlideRichContent(withBlueprint, "slide-1");
  assert.strictEqual(cleared.slides[0].id, "slide-1");
  assert.strictEqual(cleared.slides[0].richContent, undefined);

  const reset = resetOutlineSlideStructuredBody(withBlueprint, "slide-1");
  assert.deepStrictEqual(reset.slides[0].paragraphs, ["Hello"]);
  assert.strictEqual(reset.slides[0].badge, undefined);

  const v2blocks: DeckOutline = {
    meta: { title: "T", shopUrl: "https://example.com", stepTrackerTitle: "T", stepTrackerDescription: "" },
    slides: [
      {
        id: "n",
        learnSlideType: "teach",
        templateId: "teachingStamped",
        title: "T",
        richContent: [
          { type: "faq", heading: "Q", items: [{ question: "One?", answer: "Yes." }] },
          { type: "objectionAnswer", objection: "But…", response: "Because…" },
          { type: "proofGrid", items: [{ title: "A", sub: "B" }] },
          { type: "expandable", title: "More", body: "Details" },
          {
            type: "comparison",
            layoutStyle: "cards",
            rows: [{ left: "L", right: "R", highlight: "none" }],
          },
        ],
        inlineMedia: [],
      },
    ],
  };
  const r2 = compileLearnAuthoringToDeck(v2blocks);
  assert.strictEqual(r2.ok, true);

  console.log("learn-authoring-v2.test.ts: OK");
}

run();
