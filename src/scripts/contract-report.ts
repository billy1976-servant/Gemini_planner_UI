#!/usr/bin/env ts-node
/**
 * Contract report generator (documentation-only)
 *
 * Scans JSON under src/apps-json and reports parse failures only.
 * Contracts are documentation only; no programmatic validation.
 *
 * Output: `CONTRACT_VALIDATION_REPORT.md` at repo root.
 */
import fs from "fs";
import path from "path";

const ROOT = path.join(process.cwd(), "src", "apps-json");
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

  for (const file of files) {
    const { json, error } = readJson(file);
    if (!json) {
      parseFailures.push({ file: rel(file), error: error ?? "Unknown parse error" });
    }
  }

  const lines: string[] = [];
  lines.push(`# CONTRACT_VALIDATION_REPORT`);
  lines.push("");
  lines.push(`Generated: ${now}`);
  lines.push("");
  lines.push(`Contracts are **documentation only**. No programmatic validation is run.`);
  lines.push("");
  lines.push(`## Summary`);
  lines.push("");
  lines.push(`- Files scanned: **${files.length}**`);
  lines.push(`- Parse failures: **${parseFailures.length}**`);
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
