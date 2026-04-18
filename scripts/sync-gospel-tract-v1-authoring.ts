/**
 * Gospel tract: derive split authoring + `v1.json` from the current `v1.json`, apply Learn defaults
 * (palette, placeholder media, reveal pacing), then compile so runtime matches the merged outline.
 *
 * Run: npm run learn:sync-gospel-tract-v1
 */
import fs from "fs";
import path from "path";
import { compileLearnAuthoringToDeck } from "../src/lib/landing-deck/authoring/compile-learn-authoring";
import { landingDeckV1ToDeckOutline } from "../src/lib/landing-deck/authoring/deck-to-outline";
import type { DeckOutline, OutlineSlide } from "../src/lib/landing-deck/outline/types";
import type { LandingDeckV1 } from "../src/lib/landing-deck/schema";
import { compileLearnSplitToDeck } from "../src/lib/landing-deck/translator/compile-learn-split";
import { deckOutlineToLearnSplit } from "../src/lib/landing-deck/translator/outline-to-learn-split";

const FLOW_DIR = path.join(
  __dirname,
  "../src/01_App/(live) Gospel/hiclarify/learn/gospel-tract-v1"
);
const RUNTIME_JSON = path.join(FLOW_DIR, "v1.json");
const STRUCTURE_JSON = path.join(FLOW_DIR, "v1.learn-structure.json");
const CONTENT_JSON = path.join(FLOW_DIR, "v1.learn-content.json");

function enhanceOutline(o: DeckOutline): DeckOutline {
  o.meta.outlineFormatVersion = 3;
  o.meta.deckPalette = "container-creations";
  if (!o.media) o.media = {};
  o.media.tractCoverPlaceholder = {
    type: "image",
    src: "/images/logo-container-creations.webp",
    alt: "Tract artwork placeholder — replace with your image",
    caption: "Optional hero image — swap the URL or use Media slots in the inspector.",
  };

  for (const slide of o.slides) {
    const s = slide as OutlineSlide;

    if (s.id === "intro-tract") {
      s.mediaKeys = ["tractCoverPlaceholder"];
      delete (s as { inlineMedia?: unknown }).inlineMedia;
    }

    const rc = s.richContent;
    if (s.learnSlideType === "quiz") {
      s.presentation = { reveal: "none" };
    } else if (rc && rc.length >= 2) {
      s.presentation = { ...(s.presentation ?? {}), reveal: "byBlock" };
    }

    if (rc?.length === 1 && rc[0].type === "paragraph") {
      const t = String((rc[0] as { text?: string }).text ?? "").trim();
      if (/^(GOLD|DARK|RED|LIGHT|GREEN)\s*>>\s*$/i.test(t)) {
        s.presentation = { reveal: "none" };
      }
    }
  }

  return o;
}

function main() {
  const raw = fs.readFileSync(RUNTIME_JSON, "utf8");
  const deck = JSON.parse(raw) as LandingDeckV1;
  let outline = landingDeckV1ToDeckOutline(deck);
  outline = enhanceOutline(outline);

  const compiledOutline = compileLearnAuthoringToDeck(outline);
  if (compiledOutline.ok === false) {
    console.error(compiledOutline.errors.join("\n"));
    if (compiledOutline.report) console.error(compiledOutline.report);
    process.exit(1);
  }

  const { structure, content } = deckOutlineToLearnSplit(outline);
  const compiled = compileLearnSplitToDeck(structure, content);
  if (compiled.ok === false) {
    console.error(compiled.errors.join("\n"));
    if (compiled.report) console.error(compiled.report);
    process.exit(1);
  }

  fs.writeFileSync(STRUCTURE_JSON, `${JSON.stringify(structure, null, 2)}\n`, "utf8");
  fs.writeFileSync(CONTENT_JSON, `${JSON.stringify(content, null, 2)}\n`, "utf8");
  fs.writeFileSync(RUNTIME_JSON, `${JSON.stringify(compiled.deck, null, 2)}\n`, "utf8");
  console.log("Wrote:", path.relative(process.cwd(), STRUCTURE_JSON));
  console.log("Wrote:", path.relative(process.cwd(), CONTENT_JSON));
  console.log("Wrote:", path.relative(process.cwd(), RUNTIME_JSON));
}

main();
