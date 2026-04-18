import assert from "assert";
import fs from "fs";
import path from "path";
import { validateLandingDeck } from "@/lib/landing-deck/validate-landing-deck";
import {
  compileTxtAuthoringToLandingDeckLearnProfileV1,
  txtAuthoringToDeckOutlineLearnProfileV1,
} from "./txt-profile-learn-v1";

const JOURNAL_DIR = path.resolve(process.cwd(), "src/01_App/(dead) Json/apps/journal_track");

const MIN_BLUEPRINT = `
1.0 | DeckRoot | Section
1.2 | PanelA | Section
  1.2.1 | CardA | Card
  1.2.2 | FieldA | Field
`;

const MIN_CONTENT = `
1.0
- title: "Minimal deck"

1.2
- title: "First panel"

1.2.1
- body: "Card body text."

1.2.2
- label: "Field prompt text."
`;

const ORGAN_BLUEPRINT = `
1.0 | DeckRoot | Section
1.1 | Bad | organ:demo []
`;

function assertDeckValid(deck: unknown, label: string) {
  const issues = validateLandingDeck(deck, { pathLabel: label });
  const errors = issues.filter((i) => i.severity === "error");
  assert.strictEqual(errors.length, 0, errors.map((e) => e.message).join("; "));
}

function testMinimalFixture() {
  const compiled = compileTxtAuthoringToLandingDeckLearnProfileV1(MIN_BLUEPRINT, MIN_CONTENT, {
    shopUrl: "https://example.com",
  });
  assert.strictEqual(compiled.ok, true);
  if (!compiled.ok) throw new Error("compile failed");
  assert.strictEqual(compiled.deck.screens.length, 1);
  assert.strictEqual(compiled.deck.screens[0]?.title, "First panel");
  assertDeckValid(compiled.deck, "txt-profile-learn-v1.minimal");

  const outline = txtAuthoringToDeckOutlineLearnProfileV1(MIN_BLUEPRINT, MIN_CONTENT, {
    shopUrl: "https://example.com",
  });
  assert.strictEqual(outline.slides.length, 1);
  assert.strictEqual(outline.slides[0]?.id, "slide-1-2");
}

function testOrganThrows() {
  assert.throws(
    () => compileTxtAuthoringToLandingDeckLearnProfileV1(ORGAN_BLUEPRINT, ""),
    /organ node/i
  );
}

function testJournalTrackSample() {
  const blueprintText = fs.readFileSync(path.join(JOURNAL_DIR, "blueprint.txt"), "utf8");
  const contentText = fs.readFileSync(path.join(JOURNAL_DIR, "content.txt"), "utf8");

  const compiled = compileTxtAuthoringToLandingDeckLearnProfileV1(blueprintText, contentText, {
    shopUrl: "https://hiclarify.com",
    logoAlt: "HiClarify",
    stepTrackerTitle: "TRACK Journal",
  });

  assert.strictEqual(compiled.ok, true);
  if (!compiled.ok) throw new Error("compile failed");
  const deck = compiled.deck;
  assert.ok(Array.isArray(deck.screens));
  assert.ok(deck.screens.length >= 5);

  assertDeckValid(deck, "txt-profile-learn-v1.journal");
}

function main() {
  testMinimalFixture();
  testOrganThrows();
  testJournalTrackSample();
  console.log("txt-profile-learn-v1.test.ts OK");
}

main();
