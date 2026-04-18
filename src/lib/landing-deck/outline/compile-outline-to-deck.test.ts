/**
 * Golden tests for outline → LandingDeckV1 compiler (gospel-tract / onboarding patterns).
 */
import assert from "assert";
import { compileOutlineToLandingDeck } from "./compile-outline-to-deck";
import { validateLandingDeck } from "@/lib/landing-deck/validate-landing-deck";
import type { DeckOutline } from "./types";

const gospelStyleOutline: DeckOutline = {
  meta: {
    title: "Gospel tract",
    shopUrl: "https://hiclarify.com",
    logoSrc: "/images/logo.webp",
    logoAlt: "HiClarify",
    shopNowLabel: "Continue",
    stepTrackerTitle: "Gospel tract",
    stepTrackerDescription: "Teaching path",
    showResponses: true,
    responsePlaceholder: "—",
    extraLinkKeys: {
      coldCaseUrl: "https://example.com/cold-case",
    },
  },
  media: {
    hero: { type: "image", src: "/images/gospel/hero.jpg", alt: "Hero" },
  },
  slides: [
    {
      id: "intro-tract",
      stepLabel: "Welcome",
      templateId: "introStamped",
      title: "Gospel tract",
      paragraphs: ["This path follows a printed gospel tract."],
      modes: ["long"],
    },
    {
      id: "quiz-q01",
      stepLabel: "Quiz 01",
      templateId: "quizSelectStamped",
      title: "Is God self-centered?",
      quizSelect: {
        inputId: "sq01",
        label: "Your answer",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "Of course not" },
        ],
      },
      trackerValueLabels: {
        yes: "Yes",
        no: "Of course not",
      },
    },
    {
      id: "teach-01",
      templateId: "teachingStamped",
      title: "Scripture",
      paragraphs: ["For God so loved the world…"],
      bullets: ["God loves you", "Christ died for sinners"],
    },
  ],
};

function run() {
  const deck = compileOutlineToLandingDeck(gospelStyleOutline);
  assert.strictEqual(deck.shopUrl, "https://hiclarify.com");
  assert.strictEqual(deck.screens.length, 3);
  assert.strictEqual(deck.screens[0].id, "intro-tract");
  assert.strictEqual(deck.screens[0].layout, "stamped");
  assert.deepStrictEqual(deck.screens[0].modes, ["long"]);
  assert.strictEqual(deck.screens[0].nextScreenId, "quiz-q01");

  const quiz = deck.screens[1];
  assert.strictEqual(quiz.walkthrough?.inputs?.[0]?.type, "select");
  assert.strictEqual(quiz.walkthrough?.gate?.required?.[0], "sq01");
  assert.strictEqual(quiz.trackerResponse?.rule?.type, "valueLabel");
  assert.strictEqual((quiz.trackerResponse?.rule as { field: string }).field, "sq01");
  assert.strictEqual(quiz.nextScreenId, "teach-01");

  assert.strictEqual(deck.screens[2].content.some((b) => b.type === "checklist"), true);
  assert.strictEqual(deck.screens[2].nextScreenId, undefined);

  const issues = validateLandingDeck(deck, { pathLabel: "compiled-outline" });
  const errors = issues.filter((i) => i.severity === "error");
  assert.strictEqual(errors.length, 0, formatIssues(issues));

  const ventStyleOutline: DeckOutline = {
    meta: {
      title: "Vent onboarding",
      shopUrl: "https://example.com",
      stepTrackerTitle: "Setup",
      stepTrackerDescription: "Measure and confirm",
    },
    slides: [
      {
        id: "step-a",
        templateId: "introStamped",
        title: "Welcome",
        paragraphs: ["We will measure your roof."],
      },
      {
        id: "step-b",
        templateId: "proofStamped",
        title: "Why it matters",
        paragraphs: ["Correct fit prevents leaks."],
        mediaKeys: [],
      },
    ],
  };

  const ventDeck = compileOutlineToLandingDeck(ventStyleOutline);
  assert.strictEqual(ventDeck.screens[1].layout, "proofPanel");
  assert.strictEqual(ventDeck.screens[0].nextScreenId, "step-b");
  const ventIssues = validateLandingDeck(ventDeck, { pathLabel: "vent-outline" });
  assert.strictEqual(
    ventIssues.filter((i) => i.severity === "error").length,
    0,
    formatIssues(ventIssues)
  );

  console.log("compile-outline-to-deck.test.ts: OK");
}

function formatIssues(issues: { path: string; message: string; severity: string }[]): string {
  return issues.map((i) => `${i.severity} ${i.path}: ${i.message}`).join("\n");
}

run();
