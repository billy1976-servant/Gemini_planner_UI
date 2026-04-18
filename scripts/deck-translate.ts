/**
 * Deterministic: structure.json + content.json → LandingDeckV1 v1.json
 * Usage: npm run learn -- <structure.json> <content.json> <v1-out.json>
 */
import fs from "fs";
import path from "path";
import {
  translateStructureAndContentToLandingDeck,
  type LearnContentMap,
  type LearnStructureInput,
} from "../src/lib/landing-deck/translator";

const args = process.argv.slice(2);
if (args.length < 3) {
  console.error(
    "Usage: ts-node -r tsconfig-paths/register scripts/deck-translate.ts <structure.json> <content.json> <v1-out.json>"
  );
  process.exit(1);
}

const [structurePath, contentPath, outPath] = args.map((p) => path.resolve(p));

const structure = JSON.parse(fs.readFileSync(structurePath, "utf8")) as LearnStructureInput;
const content = JSON.parse(fs.readFileSync(contentPath, "utf8")) as LearnContentMap;

const deck = translateStructureAndContentToLandingDeck(structure, content);
fs.writeFileSync(outPath, `${JSON.stringify(deck, null, 2)}\n`, "utf8");
console.log("Wrote", outPath);
