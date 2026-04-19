/**
 * V3 learn authoring: contracts (button × slide kind), deck schema stamp.
 */
import assert from "assert";
import { compileLearnAuthoringToDeck } from "./compile-learn-authoring";
import { LEARN_DECK_SCHEMA_VERSION, validateLearnAuthoringContracts } from "./learn-authoring-contracts";
import type { DeckOutline } from "@/lib/landing-deck/outline/types";

const baseMeta = {
  title: "T",
  shopUrl: "https://example.com",
  stepTrackerTitle: "T",
  stepTrackerDescription: "",
};

const heroBadButtons: DeckOutline = {
  meta: { ...baseMeta, outlineFormatVersion: 3 },
  slides: [
    {
      id: "h",
      learnSlideType: "hero",
      templateId: "heroHook",
      title: "Hero",
      buttons: [{ type: "next", label: "Nope", nodeId: "x" }],
      inlineMedia: [],
    },
  ],
};

const summaryBadButtons: DeckOutline = {
  meta: { ...baseMeta, outlineFormatVersion: 3 },
  slides: [
    {
      id: "s",
      learnSlideType: "summary",
      templateId: "summaryTextOnly",
      title: "Recap",
      buttons: [{ type: "goto", label: "X", target: "h", nodeId: "y" }],
      inlineMedia: [],
    },
  ],
};

const teachOk: DeckOutline = {
  meta: { ...baseMeta, outlineFormatVersion: 3 },
  slides: [
    {
      id: "t",
      learnSlideType: "teach",
      templateId: "teachingStamped",
      title: "Lesson",
      buttons: [{ type: "next", label: "Go", nodeId: "z" }],
      inlineMedia: [],
    },
  ],
};

function run() {
  const heroErr = validateLearnAuthoringContracts(heroBadButtons);
  assert.ok(heroErr.some((e) => e.includes("next")), heroErr.join("; "));

  const sumErr = validateLearnAuthoringContracts(summaryBadButtons);
  assert.ok(sumErr.some((e) => e.includes("goto")), sumErr.join("; "));

  assert.strictEqual(validateLearnAuthoringContracts(teachOk).length, 0);

  const badCompile = compileLearnAuthoringToDeck(heroBadButtons);
  assert.strictEqual(badCompile.ok, false);

  const ok = compileLearnAuthoringToDeck(teachOk);
  assert.strictEqual(ok.ok, true);
  if (!ok.ok) return;
  assert.strictEqual(ok.deck.learnDeckSchemaVersion, LEARN_DECK_SCHEMA_VERSION);

  console.log("learn-authoring-v3.test.ts: OK");
}

run();
