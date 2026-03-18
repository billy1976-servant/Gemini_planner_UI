/**
 * npm run app — Deterministic full report generator only.
 * Loads contracts, snapshots registry, asks slug + description, writes BUILD_PLAN_REPORT.md.
 * No AI. No scaffold. No JSON/config/content files. No runtime/registry/contract changes.
 */

import readline from "node:readline";
import path from "node:path";
import fs from "node:fs";
import { registerBuiltinStructureTypes } from "../src/system/registry/registerBuiltins";
import { loadRegistrations } from "../src/system/registry/loader";
import { getEngines } from "../src/system/registry/engineRegistry";
import { getTemplates } from "../src/system/registry/templateRegistry";
import { getStructureTypes } from "../src/system/registry/structureRegistry";
import { loadTsxContracts } from "./lib/tsx-contract-loader";

function ask(prompt: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) =>
    rl.question(prompt, (ans) => {
      rl.close();
      resolve(ans);
    })
  );
}

function slugify(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function buildReportMd(
  slug: string,
  rawDescription: string,
  contracts: ReturnType<typeof loadTsxContracts>,
  engines: ReturnType<typeof getEngines>,
  templates: ReturnType<typeof getTemplates>,
  structureTypes: ReturnType<typeof getStructureTypes>
): string {
  const lines: string[] = [];

  lines.push("# BUILD PLAN REPORT");
  lines.push("");

  lines.push("## SECTION 1 — APP REQUEST");
  lines.push("");
  lines.push("- **slug**: " + slug);
  lines.push("- **raw description**: " + rawDescription);
  lines.push("");

  lines.push("## SECTION 2 — REGISTRY SNAPSHOT (EXHAUSTIVE)");
  lines.push("");
  lines.push("### All engines (full list)");
  engines.forEach((e) => lines.push("- " + e.name));
  lines.push("");
  lines.push("### All templates (full list)");
  templates.forEach((t) => lines.push("- " + t.name));
  lines.push("");
  lines.push("### All structure types");
  structureTypes.forEach((s) => lines.push("- " + s.name));
  lines.push("");
  lines.push("### All TSX25 components");
  contracts.allowedComponentTypes.forEach((c) => lines.push("- " + c));
  lines.push("");
  lines.push("### CONTRACT_VERB_LIST verbs");
  contracts.verbs.forEach((v) => lines.push("- " + v));
  lines.push("");
  lines.push("### EXPECTED_PARAMS grouped by component type");
  for (const [componentType, params] of Object.entries(contracts.expectedParams)) {
    lines.push("- **" + componentType + "**: " + (params?.join(", ") ?? ""));
  }
  lines.push("");

  lines.push("## SECTION 3 — CONTRACT SUMMARY");
  lines.push("");
  lines.push("- verbs count: " + contracts.verbsCount);
  lines.push("- layout node types count: " + contracts.layoutNodeTypesCount);
  lines.push("- expected param groups count: " + Object.keys(contracts.expectedParams).length);
  lines.push("- tsx25 component count: " + contracts.allowedComponentTypes.length);
  lines.push("");

  lines.push("## SECTION 4 — EXECUTION RULES FOR CURSOR");
  lines.push("");
  lines.push("- Only use registered engines.");
  lines.push("- Only use registered templates.");
  lines.push("- Only use TSX25 components.");
  lines.push("- Only use CONTRACT_VERB_LIST verbs.");
  lines.push("- Only use EXPECTED_PARAMS per component.");
  lines.push("- No router.");
  lines.push("- No JSON compiler.");
  lines.push("- No hardcoded state keys.");
  lines.push("- No hardcoded strings outside content object.");
  lines.push("- Do not scaffold until approved.");
  lines.push("");

  return lines.join("\n");
}

async function main() {
  const repoRoot = process.cwd();

  let contracts: ReturnType<typeof loadTsxContracts>;
  try {
    contracts = loadTsxContracts(repoRoot);
  } catch (e) {
    process.stderr.write(String((e as Error).message) + "\n");
    process.exit(1);
  }

  registerBuiltinStructureTypes();
  await loadRegistrations({
    repoRoot,
    engineDir: "src/05_Logic/logic/engines",
    templateDirs: [
      "src/lib/tsx-structure/resolver",
      "src/04_Presentation/components/organs/tsx",
    ],
  });

  const engines = getEngines();
  const templates = getTemplates();
  const structureTypes = getStructureTypes();

  const slugInput = (await ask("App slug:\n> ")).trim();
  if (!slugInput) {
    process.stderr.write("Slug is required.\n");
    process.exit(1);
  }
  const slug = slugify(slugInput) || "app";

  const rawDescription = (await ask("App description:\n> ")).trim();

  const targetDir = path.resolve(repoRoot, "src/01_App/_auto-generated", slug);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const reportPath = path.join(targetDir, "BUILD_PLAN_REPORT.md");
  const reportContent = buildReportMd(
    slug,
    rawDescription,
    contracts,
    engines,
    templates,
    structureTypes
  );
  fs.writeFileSync(reportPath, reportContent, "utf8");

  process.stdout.write(path.resolve(reportPath) + "\n");
}

main().catch((e) => {
  process.stderr.write(String((e?.stack ?? e) + "\n"));
  process.exit(1);
});
