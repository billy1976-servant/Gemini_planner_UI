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

function main() {
  testJournalBaseline();
  testQuizAndFlow();
  testSequenceOrder();
  testProofScripture();
  console.log("txt-profile-learn-v2.test.ts OK");
}

main();
