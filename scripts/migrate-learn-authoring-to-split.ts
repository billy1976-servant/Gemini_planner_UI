/**
 * Phase 3: each `*.learn-authoring.json` under src/01_App → split files + recompiled `<stem>.json`, then delete monolith.
 *
 * Run: npm run learn:migrate-authoring
 * Dry run: npm run learn:migrate-authoring -- --dry-run
 */
import fs from "fs";
import path from "path";
import { findRepoRoot } from "../src/lib/deck-platform/registry";
import { compileLearnSplitToDeck } from "../src/lib/landing-deck/translator/compile-learn-split";
import { deckOutlineToLearnSplit } from "../src/lib/landing-deck/translator/outline-to-learn-split";
import type { DeckOutline } from "../src/lib/landing-deck/outline/types";

const repoRoot = findRepoRoot(process.cwd());
const appBase = path.join(repoRoot, "src", "01_App");
const dryRun = process.argv.includes("--dry-run");

function walkLearnAuthoringFiles(dir: string, out: string[]): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      walkLearnAuthoringFiles(full, out);
    } else if (e.isFile() && e.name.endsWith(".learn-authoring.json")) {
      out.push(full);
    }
  }
}

function main() {
  const files: string[] = [];
  if (fs.existsSync(appBase)) walkLearnAuthoringFiles(appBase, files);
  files.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

  if (files.length === 0) {
    console.log("No .learn-authoring.json files under src/01_App.");
    return;
  }

  let failed = false;
  for (const authoringPath of files) {
    const dir = path.dirname(authoringPath);
    const base = path.basename(authoringPath, ".learn-authoring.json");
    const structurePath = path.join(dir, `${base}.learn-structure.json`);
    const contentPath = path.join(dir, `${base}.learn-content.json`);
    const deckPath = path.join(dir, `${base}.json`);

    let outline: DeckOutline;
    try {
      outline = JSON.parse(fs.readFileSync(authoringPath, "utf8")) as DeckOutline;
    } catch (e) {
      console.error("Skip (invalid JSON):", path.relative(repoRoot, authoringPath), e);
      continue;
    }
    if (!Array.isArray(outline?.slides) || outline.slides.length === 0) {
      console.error("Skip (not an outline):", path.relative(repoRoot, authoringPath));
      continue;
    }

    const { structure, content } = deckOutlineToLearnSplit(outline);
    const compiled = compileLearnSplitToDeck(structure, content);
    if (compiled.ok === false) {
      console.error("Compile failed:", path.relative(repoRoot, authoringPath));
      console.error(compiled.errors.join("\n"));
      if (compiled.report) console.error(compiled.report);
      failed = true;
      continue;
    }

    const rel = (p: string) => path.relative(repoRoot, p).split(path.sep).join("/");
    if (dryRun) {
      console.log("[dry-run] would write", rel(structurePath), rel(contentPath), rel(deckPath), "and remove", rel(authoringPath));
      continue;
    }

    fs.writeFileSync(structurePath, `${JSON.stringify(structure, null, 2)}\n`, "utf8");
    fs.writeFileSync(contentPath, `${JSON.stringify(content, null, 2)}\n`, "utf8");
    fs.writeFileSync(deckPath, `${JSON.stringify(compiled.deck, null, 2)}\n`, "utf8");
    fs.unlinkSync(authoringPath);
    console.log("Migrated:", rel(authoringPath));
  }

  if (failed) process.exit(1);
}

main();
