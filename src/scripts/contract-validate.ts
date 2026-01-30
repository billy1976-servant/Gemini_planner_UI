#!/usr/bin/env ts-node
/**
 * Contract validation runner (WARN-ONLY)
 * Scans all JSON files under `src/apps-offline/` (recursive) and prints contract warnings.
 */
import fs from "fs";
import path from "path";
import { warnBlueprintViolations, validateBlueprintTree } from "../contracts/blueprint-universe.validator";

const ROOT = path.join(process.cwd(), "src", "apps-offline");

function listJsonFiles(dir: string): string[] {
  const out: string[] = [];
  if (!fs.existsSync(dir)) return out;

  const walk = (p: string) => {
    const entries = fs.readdirSync(p, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(p, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.isFile() && e.name.endsWith(".json")) out.push(full);
    }
  };

  walk(dir);
  return out;
}

function rel(p: string) {
  return p.replace(process.cwd() + path.sep, "").replace(/\\/g, "/");
}

function readJson(filePath: string): any | null {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch (e: any) {
    console.warn(`[contract:validate] Failed to parse JSON: ${rel(filePath)}`, e?.message ?? e);
    return null;
  }
}

function main() {
  const files = listJsonFiles(ROOT);
  if (!files.length) {
    console.log(`[contract:validate] No JSON files found under ${rel(ROOT)}`);
    return;
  }

  let filesWithViolations = 0;
  let totalViolations = 0;

  for (const file of files) {
    const json = readJson(file);
    if (!json) continue;

    const violations = validateBlueprintTree(json);
    if (!violations.length) continue;

    filesWithViolations++;
    totalViolations += violations.length;

    // Print a grouped, warn-only block (deduped per file)
    warnBlueprintViolations(json, {
      source: `offline:${rel(file)}`,
      dedupeKeyPrefix: `offline-file:${rel(file)}`,
      maxWarnings: 200,
    });
  }

  console.log(
    `[contract:validate] Done. Files with violations: ${filesWithViolations}/${files.length}. Total violations (pre-dedupe): ${totalViolations}.`
  );
}

main();

