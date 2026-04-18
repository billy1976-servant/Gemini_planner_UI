/**
 * Legacy embedded demo outlines (minimal snapshots). Canonical polished demos live under:
 *   `src/01_App/(live) Gospel/hiclarify/learn/gospel-teaching-v1/`
 *   `src/01_App/(live) Gospel/hiclarify/learn/gospel-tract-v1/` (+ `npm run learn:sync-gospel-tract-v1` to resync split + runtime from `v1.json`)
 *   `src/01_App/(live) Business/containercreations/learn/business-edu-v1/`
 * Run: npx ts-node -r tsconfig-paths/register scripts/generate-learn-v1-demos.ts
 */
import fs from "fs";
import path from "path";
import { compileLearnAuthoringToDeck } from "../src/lib/landing-deck/authoring/compile-learn-authoring";
import type { DeckOutline } from "../src/lib/landing-deck/outline/types";
import { compileLearnSplitToDeck } from "../src/lib/landing-deck/translator/compile-learn-split";
import { deckOutlineToLearnSplit } from "../src/lib/landing-deck/translator/outline-to-learn-split";

const gospel: DeckOutline = {
  meta: {
    title: "Gospel teaching demo",
    shopUrl: "https://hiclarify.com",
    logoSrc: "/images/logo-container-creations.webp",
    logoAlt: "HiClarify",
    shopNowLabel: "Continue",
    stepTrackerTitle: "Gospel teaching",
    stepTrackerDescription: "Intro, teach, respond.",
    showResponses: true,
    responsePlaceholder: "—",
  },
  slides: [
    {
      id: "s1",
      learnSlideType: "intro",
      templateId: "introStamped",
      title: "Welcome",
      stepLabel: "Welcome",
      richContent: [{ type: "paragraph", text: "A short gospel teaching path." }],
      inlineMedia: [],
    },
    {
      id: "s2",
      learnSlideType: "hero",
      templateId: "heroHook",
      title: "Good news",
      subtitle: "God loves you",
      richContent: [{ type: "badge", text: "Demo" }],
      inlineMedia: [],
    },
    {
      id: "s3",
      learnSlideType: "teach",
      templateId: "teachingStamped",
      title: "The message",
      richContent: [{ type: "paragraph", text: "Christ died for our sins and rose again." }],
      inlineMedia: [],
    },
    {
      id: "s4",
      learnSlideType: "quiz",
      templateId: "quizSelectStamped",
      title: "Will you trust him?",
      quizSelect: {
        inputId: "trust",
        label: "Your response",
        options: [
          { value: "yes", label: "Yes" },
          { value: "not_yet", label: "Not yet" },
        ],
      },
      richContent: [],
      inlineMedia: [],
    },
    {
      id: "s5",
      learnSlideType: "cta",
      templateId: "ctaStamped",
      title: "Next steps",
      richContent: [{ type: "paragraph", text: "Pray, read Scripture, connect with a church." }],
      inlineMedia: [],
    },
  ],
};

const business: DeckOutline = {
  meta: {
    title: "Business onboarding demo",
    shopUrl: "https://containercreations.com",
    logoSrc: "/images/logo-container-creations.webp",
    logoAlt: "Container Creations",
    shopNowLabel: "Get started",
    stepTrackerTitle: "Product onboarding",
    stepTrackerDescription: "Learn the essentials.",
    showResponses: false,
    responsePlaceholder: "",
  },
  slides: [
    {
      id: "b1",
      learnSlideType: "hero",
      templateId: "heroHook",
      title: "Welcome aboard",
      subtitle: "Your first 5 minutes",
      richContent: [{ type: "paragraph", text: "We cover value, proof, and your first action." }],
      inlineMedia: [],
    },
    {
      id: "b2",
      learnSlideType: "teach",
      templateId: "teachingStamped",
      title: "What we solve",
      richContent: [
        {
          type: "checklist",
          heading: "Outcomes",
          items: [
            { title: "Faster setup", sub: "" },
            { title: "Clear next steps", sub: "" },
          ],
        },
      ],
      inlineMedia: [],
    },
    {
      id: "b3",
      learnSlideType: "comparison",
      templateId: "comparisonTwoCol",
      title: "Why us",
      richContent: [
        {
          type: "comparison",
          heading: "Compare",
          columnLabels: { left: "Us", right: "Typical" },
          rows: [{ left: "Guided flow", right: "Static PDFs", highlight: "left" }],
        },
      ],
      inlineMedia: [],
    },
    {
      id: "b4",
      learnSlideType: "proof",
      templateId: "proofStamped",
      title: "Proof",
      richContent: [{ type: "paragraph", text: "Teams ship onboarding in days, not weeks." }],
      inlineMedia: [],
    },
    {
      id: "b5",
      learnSlideType: "summary",
      templateId: "summaryTextOnly",
      title: "Recap",
      richContent: [{ type: "paragraph", text: "You now know the story and the differentiator." }],
      inlineMedia: [],
    },
    {
      id: "b6",
      learnSlideType: "cta",
      templateId: "ctaStamped",
      title: "Start checklist",
      richContent: [],
      inlineMedia: [],
    },
  ],
};

const repoRoot = path.resolve(__dirname, "..");

function writeFlow(relDir: string, outline: DeckOutline) {
  const r = compileLearnAuthoringToDeck(outline);
  if (r.ok === false) {
    console.error(relDir, r.errors);
    process.exit(1);
  }
  const { structure, content } = deckOutlineToLearnSplit(outline);
  const split = compileLearnSplitToDeck(structure, content);
  if (split.ok === false) {
    console.error(relDir, split.errors);
    process.exit(1);
  }
  const dir = path.join(repoRoot, relDir);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "v1.learn-structure.json"), `${JSON.stringify(structure, null, 2)}\n`);
  fs.writeFileSync(path.join(dir, "v1.learn-content.json"), `${JSON.stringify(content, null, 2)}\n`);
  fs.writeFileSync(path.join(dir, "v1.json"), `${JSON.stringify(split.deck, null, 2)}\n`);
  console.log("Wrote", relDir);
}

writeFlow("src/01_App/(live) Gospel/hiclarify/learn/gospel-teaching-v1", gospel);
writeFlow("src/01_App/(live) Business/containercreations/learn/business-edu-v1", business);
