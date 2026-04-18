/**
 * One-off: a single `*.learn-authoring.json` → split files + recompiled `<stem>.json`.
 * Repo-wide migration: `npm run learn:migrate-authoring`
 *
 * Run: npx ts-node -r tsconfig-paths/register scripts/emit-learn-split-from-authoring.ts <path-to.learn-authoring.json>
 */
import fs from "fs";
import path from "path";
import { compileLearnSplitToDeck } from "../src/lib/landing-deck/translator/compile-learn-split";
import { deckOutlineToLearnSplit } from "../src/lib/landing-deck/translator/outline-to-learn-split";
import type { DeckOutline } from "../src/lib/landing-deck/outline/types";

const authoringPath = path.resolve(process.argv[2] ?? "");
if (!authoringPath || !authoringPath.endsWith(".learn-authoring.json")) {
  console.error("Usage: ts-node -r tsconfig-paths/register scripts/emit-learn-split-from-authoring.ts <file.learn-authoring.json>");
  process.exit(1);
}

const dir = path.dirname(authoringPath);
const base = path.basename(authoringPath, ".learn-authoring.json");
const structurePath = path.join(dir, `${base}.learn-structure.json`);
const contentPath = path.join(dir, `${base}.learn-content.json`);
const deckPath = path.join(dir, `${base}.json`);

const outline = JSON.parse(fs.readFileSync(authoringPath, "utf8")) as DeckOutline;
const { structure, content } = deckOutlineToLearnSplit(outline);
const compiled = compileLearnSplitToDeck(structure, content);
if (compiled.ok === false) {
  console.error(compiled.errors.join("\n"));
  if (compiled.report) console.error(compiled.report);
  process.exit(1);
}

fs.writeFileSync(structurePath, `${JSON.stringify(structure, null, 2)}\n`, "utf8");
fs.writeFileSync(contentPath, `${JSON.stringify(content, null, 2)}\n`, "utf8");
fs.writeFileSync(deckPath, `${JSON.stringify(compiled.deck, null, 2)}\n`, "utf8");
console.log("Wrote:", structurePath);
console.log("Wrote:", contentPath);
console.log("Wrote:", deckPath);
