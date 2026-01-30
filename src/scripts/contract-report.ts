#!/usr/bin/env ts-node
/**
 * Contract report generator (WARN-ONLY)
 *
 * Produces a stable, diff-friendly report from the validator:
 * - counts by violation code
 * - top offending files
 * - parse failures
 *
 * Output: `CONTRACT_VALIDATION_REPORT.md` at repo root.
 */
import fs from "fs";
import path from "path";
import { validateBlueprintTree } from "../contracts/blueprint-universe.validator";

const ROOT = path.join(process.cwd(), "src", "apps-offline");
const OUT = path.join(process.cwd(), "CONTRACT_VALIDATION_REPORT.md");

function rel(p: string) {
  return p.replace(process.cwd() + path.sep, "").replace(/\\/g, "/");
}

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

function readJson(filePath: string): { json: any | null; error?: string } {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const json = JSON.parse(raw);
    return { json };
  } catch (e: any) {
    return { json: null, error: e?.message ?? String(e) };
  }
}

function main() {
  const files = listJsonFiles(ROOT);
  const now = new Date().toISOString();

  const parseFailures: Array<{ file: string; error: string }> = [];
  const byCode: Record<string, number> = {};
  const byFile: Array<{
    file: string;
    violations: number;
    codes: Record<string, number>;
  }> = [];

  for (const file of files) {
    const { json, error } = readJson(file);
    if (!json) {
      parseFailures.push({ file: rel(file), error: error ?? "Unknown parse error" });
      continue;
    }

    const violations = validateBlueprintTree(json);
    if (!violations.length) continue;

    const codes: Record<string, number> = {};
    for (const v of violations) {
      byCode[v.code] = (byCode[v.code] ?? 0) + 1;
      codes[v.code] = (codes[v.code] ?? 0) + 1;
    }

    byFile.push({
      file: rel(file),
      violations: violations.length,
      codes,
    });
  }

  byFile.sort((a, b) => b.violations - a.violations);

  const codeRows = Object.entries(byCode).sort((a, b) => b[1] - a[1]);
  const topFiles = byFile.slice(0, 25);

  const lines: string[] = [];
  lines.push(`# CONTRACT_VALIDATION_REPORT`);
  lines.push("");
  lines.push(`Generated: ${now}`);
  lines.push("");
  lines.push(`Scope: \`${rel(ROOT)}\``);
  lines.push("");
  lines.push(`## Summary`);
  lines.push("");
  lines.push(`- Files scanned: **${files.length}**`);
  lines.push(`- Files with violations: **${byFile.length}**`);
  lines.push(`- Parse failures: **${parseFailures.length}**`);
  lines.push("");

  lines.push(`## Violations by code`);
  lines.push("");
  if (!codeRows.length) {
    lines.push(`(none)`);
  } else {
    for (const [code, count] of codeRows) {
      lines.push(`- **${code}**: ${count}`);
    }
  }
  lines.push("");

  lines.push(`## Top offending files`);
  lines.push("");
  if (!topFiles.length) {
    lines.push(`(none)`);
  } else {
    for (const f of topFiles) {
      const codes = Object.entries(f.codes)
        .sort((a, b) => b[1] - a[1])
        .map(([c, n]) => `${c}:${n}`)
        .join(", ");
      lines.push(`- **${f.violations}** \`${f.file}\` (${codes})`);
    }
  }
  lines.push("");

  lines.push(`## Parse failures`);
  lines.push("");
  if (!parseFailures.length) {
    lines.push(`(none)`);
  } else {
    for (const p of parseFailures) {
      lines.push(`- \`${p.file}\` — ${p.error}`);
    }
  }
  lines.push("");

  fs.writeFileSync(OUT, lines.join("\n"), "utf8");
  console.log(`[contract:report] Wrote ${rel(OUT)}`);
}

main();

