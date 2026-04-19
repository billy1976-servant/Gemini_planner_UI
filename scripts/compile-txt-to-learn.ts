/**
 * CLI: folder with blueprint.txt + content.txt → Learn JSON via Learn profile v1 or v2.
 * TXT is universal source; Learn is one target profile.
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register scripts/compile-txt-to-learn.ts [--profile v1|v2] <folder> [out-json-path]
 *
 * Default profile: v2. Default out: <folder>/v1.learn-from-txt.json when out omitted.
 */
import fs from "fs";
import path from "path";
import { deckOutlineToLearnSplit } from "../src/lib/landing-deck/translator/outline-to-learn-split";
import { compileLearnSplitToDeck } from "../src/lib/landing-deck/translator/compile-learn-split";
import { validateLandingDeck, formatValidationReport } from "../src/lib/landing-deck/validate-landing-deck";
import { loadLearnCompileOptions } from "../src/lib/txt-authoring/load-learn-compile-options";
import {
  compileTxtAuthoringToLandingDeckLearnProfileV1,
  txtAuthoringToDeckOutlineLearnProfileV1,
} from "../src/lib/txt-authoring/profiles/learn/txt-profile-learn-v1";
import {
  compileTxtAuthoringToLandingDeckLearnProfileV2,
  txtAuthoringToDeckOutlineLearnProfileV2,
} from "../src/lib/txt-authoring/profiles/learn/txt-profile-learn-v2";

const args = process.argv.slice(2);
let profile: "v1" | "v2" = "v2";
const rest: string[] = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--profile" && args[i + 1]) {
    const p = args[++i].toLowerCase();
    if (p === "v1" || p === "v2") profile = p;
    else {
      console.error('Invalid --profile (use v1 or v2)');
      process.exit(1);
    }
    continue;
  }
  rest.push(a);
}

const folder = path.resolve(rest[0] ?? "");
const outArg = rest[1];

if (!folder || !fs.existsSync(path.join(folder, "blueprint.txt"))) {
  console.error(
    "Usage: ts-node -r tsconfig-paths/register scripts/compile-txt-to-learn.ts [--profile v1|v2] <folder-with-blueprint> [out.json]"
  );
  process.exit(1);
}

const blueprintPath = path.join(folder, "blueprint.txt");
const contentPath = path.join(folder, "content.txt");
const blueprintText = fs.readFileSync(blueprintPath, "utf8");
const contentText = fs.existsSync(contentPath) ? fs.readFileSync(contentPath, "utf8") : "";

/** Baseline CLI defaults; optional `learn.compile-options.json` in the folder merges on top (file wins). */
const compileOpts = {
  shopUrl: "https://hiclarify.com",
  logoAlt: "HiClarify",
  ...loadLearnCompileOptions(folder),
};

const compiled =
  profile === "v1"
    ? compileTxtAuthoringToLandingDeckLearnProfileV1(blueprintText, contentText, compileOpts)
    : compileTxtAuthoringToLandingDeckLearnProfileV2(blueprintText, contentText, compileOpts);

if (compiled.ok === false) {
  console.error(compiled.errors.join("\n"));
  if (compiled.report) console.error(compiled.report);
  process.exit(1);
}

const issues = validateLandingDeck(compiled.deck, { pathLabel: "compile-txt-to-learn" });
const errors = issues.filter((i) => i.severity === "error");
if (errors.length > 0) {
  console.error(formatValidationReport(issues));
  process.exit(1);
}

const outJson = outArg ? path.resolve(outArg) : path.join(folder, "v1.learn-from-txt.json");
fs.writeFileSync(outJson, `${JSON.stringify(compiled.deck, null, 2)}\n`, "utf8");
console.log("Wrote", path.relative(process.cwd(), outJson), `(profile ${profile})`);

const outline =
  profile === "v1"
    ? txtAuthoringToDeckOutlineLearnProfileV1(blueprintText, contentText, compileOpts)
    : txtAuthoringToDeckOutlineLearnProfileV2(blueprintText, contentText, compileOpts);

const { structure, content } = deckOutlineToLearnSplit(outline);
const split = compileLearnSplitToDeck(structure, content);
if (split.ok === true) {
  const base = path.basename(outJson, ".json");
  const dir = path.dirname(outJson);
  fs.writeFileSync(path.join(dir, `${base}.learn-structure.json`), `${JSON.stringify(structure, null, 2)}\n`, "utf8");
  fs.writeFileSync(path.join(dir, `${base}.learn-content.json`), `${JSON.stringify(content, null, 2)}\n`, "utf8");
  console.log("Wrote derived split:", `${base}.learn-structure.json`, `${base}.learn-content.json`);
} else {
  console.warn("Split compile skipped:", split.errors.join("; "));
}
