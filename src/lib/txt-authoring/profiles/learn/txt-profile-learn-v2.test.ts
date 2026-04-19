import assert from "assert";
import fs from "fs";
import path from "path";
import { validateLandingDeck } from "@/lib/landing-deck/validate-landing-deck";
import {
  compileTxtAuthoringToLandingDeckLearnProfileV2,
  txtAuthoringToDeckOutlineLearnProfileV2,
} from "./txt-profile-learn-v2";

const JOURNAL_DIR = path.resolve(process.cwd(), "src/01_App/(dead) Json/apps/journal_track");

const QUIZ_BLUEPRINT = `
1.0 | Root | Section
1.2 | Ask | Section
-> 1.3
  1.2.1 | C | Card [body]
1.3 | Next | Section
  1.3.1 | C2 | Card [body]
`;

const QUIZ_CONTENT = `
1.0
- title: "Deck"

1.2
- title: "Quiz step"
- learn.kind: quiz
- learn.quiz.inputId: q1
- learn.quiz.question: "Pick one:"
- learn.quiz.options: Alpha | Beta | Gamma

1.2.1
- body: "(ignored for quiz kind — question from learn.quiz.question)"

1.3
- title: "After quiz"
- learn.kind: teach

1.3.1
- body: "Done."
`;

const SEQUENCE_BLUEPRINT = `
SEQUENCE:
Second, First

1.0 | D | Section
1.2 | First | Section
  1.2.1 | C | Card [body]
1.3 | Second | Section
  1.3.1 | C2 | Card [body]
`;

const SEQUENCE_CONTENT = `
1.0
- title: "S"

1.2
- title: "First slide"

1.2.1
- body: "A"

1.3
- title: "Second slide"

1.3.1
- body: "B"
`;

const PROOF_BLUEPRINT = `
1.0 | D | Section
1.2 | P | Section
  1.2.1 | Card1 | Card [body]
`;

const PROOF_CONTENT = `
1.0
- title: "Deck"

1.2
- title: "Word"
- learn.kind: proof
- learn.scripture.text: "Your word is a lamp to my feet."
- learn.scripture.reference: "Psalm 119:105"

1.2.1
- body: "Supporting note."
`;

function assertDeckOk(deck: unknown, label: string) {
  const issues = validateLandingDeck(deck, { pathLabel: label });
  const errors = issues.filter((i) => i.severity === "error");
  assert.strictEqual(errors.length, 0, errors.map((e) => e.message).join("; "));
}

function testJournalBaseline() {
  const blueprintText = fs.readFileSync(path.join(JOURNAL_DIR, "blueprint.txt"), "utf8");
  const contentText = fs.readFileSync(path.join(JOURNAL_DIR, "content.txt"), "utf8");
  const compiled = compileTxtAuthoringToLandingDeckLearnProfileV2(blueprintText, contentText, {
    shopUrl: "https://hiclarify.com",
  });
  if (compiled.ok === false) assert.fail(compiled.errors.join("\n"));
  assert.ok(compiled.deck.screens.length >= 5);
  assertDeckOk(compiled.deck, "v2.journal");
}

function testQuizAndFlow() {
  const compiled = compileTxtAuthoringToLandingDeckLearnProfileV2(QUIZ_BLUEPRINT, QUIZ_CONTENT, {
    shopUrl: "https://example.com",
  });
  if (compiled.ok === false) assert.fail(compiled.errors.join("\n"));
  const quizIdx = compiled.deck.screens.findIndex((s) => s.walkthrough?.inputs?.length);
  assert.ok(quizIdx >= 0);
  assertDeckOk(compiled.deck, "v2.quiz");
}

function testSequenceOrder() {
  const outline = txtAuthoringToDeckOutlineLearnProfileV2(SEQUENCE_BLUEPRINT, SEQUENCE_CONTENT, {
    shopUrl: "https://example.com",
  });
  assert.strictEqual(outline.slides.length, 2);
  assert.strictEqual(outline.slides[0]?.title, "Second slide");
  assert.strictEqual(outline.slides[1]?.title, "First slide");
  const compiled = compileTxtAuthoringToLandingDeckLearnProfileV2(SEQUENCE_BLUEPRINT, SEQUENCE_CONTENT, {
    shopUrl: "https://example.com",
  });
  if (compiled.ok === false) assert.fail(compiled.errors.join("\n"));
  assertDeckOk(compiled.deck, "v2.sequence");
}

function testProofScripture() {
  const compiled = compileTxtAuthoringToLandingDeckLearnProfileV2(PROOF_BLUEPRINT, PROOF_CONTENT, {
    shopUrl: "https://example.com",
  });
  if (compiled.ok === false) assert.fail(compiled.errors.join("\n"));
  const scr = compiled.deck.screens[0]?.content?.some(
    (b) => (b as { type?: string }).type === "scripture"
  );
  assert.strictEqual(scr, true);
  assertDeckOk(compiled.deck, "v2.proof");
}

const PRESET_BLUEPRINT = `
1.0 | D | Section
1.2 | T | Section
  1.2.1 | C | Card [body]
`;

const PRESET_CONTENT = `
1.0
- title: "Deck"

1.2
- title: "Teach slide"

1.2.1
- body: "Hello."
`;

/** `slidePresentationDefaults` fills tone/density when omitted in TXT. */
function testSlidePresentationDefaults() {
  const compiled = compileTxtAuthoringToLandingDeckLearnProfileV2(PRESET_BLUEPRINT, PRESET_CONTENT, {
    shopUrl: "https://example.com",
    slidePresentationDefaults: {
      visualTone: "soft",
      density: "comfortable",
    },
  });
  if (compiled.ok === false) assert.fail(compiled.errors.join("\n"));
  const scr = compiled.deck.screens[0];
  assert.strictEqual(scr?.visualTone, "soft");
  assert.strictEqual(scr?.density, "comfortable");
}

const AUDIO_CTA_BLUEPRINT = `
1.0 | D | Section
1.2 | T | Section
  1.2.1 | C | Card [body]
`;

const AUDIO_CTA_CONTENT = `
1.0
- title: "Deck"

1.2
- title: "Rich teach"
- learn.heading.text: "H"
- learn.ctaBand.headline: "Band"
- learn.audio.src: "https://example.com/a.mp3"
- learn.media.imageGrid.images: "https://a.com/1.png|A ; https://a.com/2.png|B"
- learn.media.beforeAfter.before: "https://a.com/b1.png"
- learn.media.beforeAfter.after: "https://a.com/b2.png"
- learn.media.beforeAfter.altBefore: "B1"
- learn.media.beforeAfter.altAfter: "B2"

1.2.1
- body: "X"
`;

function testCtaBandAudioAndMedia() {
  const compiled = compileTxtAuthoringToLandingDeckLearnProfileV2(AUDIO_CTA_BLUEPRINT, AUDIO_CTA_CONTENT, {
    shopUrl: "https://example.com",
  });
  if (compiled.ok === false) assert.fail(compiled.errors.join("\n"));
  const s0 = compiled.deck.screens[0];
  const hasCta = s0?.content?.some((b) => (b as { type?: string }).type === "ctaBand");
  const hasAudio = s0?.content?.some((b) => (b as { type?: string }).type === "audio");
  const m = s0?.media ?? [];
  const hasGrid = m.some((x) => (x as { type?: string }).type === "imageGrid");
  const hasBA = m.some((x) => (x as { type?: string }).type === "beforeAfter");
  assert.strictEqual(hasCta, true);
  assert.strictEqual(hasAudio, true);
  assert.strictEqual(hasGrid, true);
  assert.strictEqual(hasBA, true);
}

const LAYOUT_KEYED_BLUEPRINT = `
1.0 | D | Section
1.2 | T | Section
  1.2.1 | C | Card [body]
`;

const LAYOUT_KEYED_CONTENT = `
1.0
- title: "Deck"

1.2
- title: "Teach override + keyed rail"
- learn.kind: teach
- learn.heading.text: "H"
- learn.layoutOverride: splitProof
- learn.media.key: demoKey
- learn.media.image: /images/demo.png

1.2.1
- body: "Body."
`;

function testLayoutOverrideAndKeyedMedia() {
  const outline = txtAuthoringToDeckOutlineLearnProfileV2(LAYOUT_KEYED_BLUEPRINT, LAYOUT_KEYED_CONTENT, {
    shopUrl: "https://example.com",
  });
  const teach = outline.slides.find((s) => s.learnSlideType === "teach");
  assert.strictEqual(teach?.layoutOverride, "splitProof");
  assert.deepStrictEqual(teach?.mediaKeys, ["demoKey"]);
  assert.strictEqual(outline.media?.demoKey?.src, "/images/demo.png");

  const compiled = compileTxtAuthoringToLandingDeckLearnProfileV2(LAYOUT_KEYED_BLUEPRINT, LAYOUT_KEYED_CONTENT, {
    shopUrl: "https://example.com",
  });
  if (compiled.ok === false) assert.fail(compiled.errors.join("\n"));
  assert.strictEqual(compiled.deck.screens[0]?.layout, "splitProof");
  const rail = compiled.deck.screens[0]?.media ?? [];
  assert.strictEqual(rail.some((x) => (x as { src?: string }).src === "/images/demo.png"), true);
  assertDeckOk(compiled.deck, "v2.layoutKeyed");
}

function main() {
  testJournalBaseline();
  testQuizAndFlow();
  testSequenceOrder();
  testProofScripture();
  testSlidePresentationDefaults();
  testCtaBandAudioAndMedia();
  testLayoutOverrideAndKeyedMedia();
  console.log("txt-profile-learn-v2.test.ts OK");
}

main();
