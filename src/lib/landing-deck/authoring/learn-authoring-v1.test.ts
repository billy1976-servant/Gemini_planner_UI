/**
 * V1 learn authoring: compile + validate + round-trip helpers.
 */
import assert from "assert";
import { compileLearnAuthoringToDeck } from "./compile-learn-authoring";
import { landingDeckV1ToDeckOutline, isDeckOutlineShape } from "./deck-to-outline";
import { validateLandingDeck } from "@/lib/landing-deck/validate-landing-deck";
import type { DeckOutline } from "@/lib/landing-deck/outline/types";

const minimal: DeckOutline = {
  meta: {
    title: "T",
    shopUrl: "https://example.com",
    stepTrackerTitle: "T",
    stepTrackerDescription: "",
  },
  slides: [
    {
      id: "a",
      learnSlideType: "comparison",
      templateId: "comparisonTwoCol",
      title: "Compare",
      richContent: [
        {
          type: "comparison",
          heading: "X",
          columnLabels: { left: "L", right: "R" },
          rows: [{ left: "a", right: "b", highlight: "none" }],
        },
      ],
      inlineMedia: [],
    },
  ],
};

function run() {
  const r = compileLearnAuthoringToDeck(minimal);
  assert.strictEqual(r.ok, true);
  if (!r.ok) return;
  assert.strictEqual(r.deck.learnDeckSchemaVersion, 3);
  assert.strictEqual(r.deck.screens[0].layout, "twoCol");
  const issues = validateLandingDeck(r.deck, { pathLabel: "learn-authoring-v1.test" });
  assert.strictEqual(
    issues.filter((i) => i.severity === "error").length,
    0,
    issues.map((i) => i.message).join("; ")
  );

  const back = landingDeckV1ToDeckOutline(r.deck);
  assert.strictEqual(isDeckOutlineShape(back), true);
  assert.strictEqual(back.slides[0].inlineMedia?.length ?? 0, 0);

  console.log("learn-authoring-v1.test.ts: OK");
}

run();
