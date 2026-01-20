import fs from "fs";
import path from "path";
import chalk from "chalk";

// Root directory
const ROOT = path.resolve(__dirname, "..");

// COLORS
const OK = chalk.green("✔");
const FAIL = chalk.red("✗");
const WARN = chalk.yellow("!");

// FILE TYPES THAT MAY HAVE EXPORTS
const TS_EXT = [".ts", ".tsx"];
const IGNORE_EXPORTS = [".json", ".md", ".css"];

// ---------------------------------------------------------
// TYPES
// ---------------------------------------------------------

export interface DiagnosticNode {
  name: string;
  fullPath: string;
  exists: boolean;
  status: string;
  exports?: string[];
  children?: DiagnosticNode[];
}

// ---------------------------------------------------------
// EXPORT CHECKING
// ---------------------------------------------------------

function getExports(file: string): string[] {
  try {
    const mod = require(file);
    return Object.keys(mod);
  } catch {
    return [];
  }
}

function validateFile(filePath: string): {
  ok: boolean;
  exports?: string[];
} {
  const ext = path.extname(filePath);

  // JSON / MD / CSS do NOT require export validation
  if (IGNORE_EXPORTS.includes(ext)) {
    return { ok: true };
  }

  // Only check exports for TS / TSX
  if (TS_EXT.includes(ext)) {
    const exportsArr = getExports(filePath);
    return { ok: exportsArr.length > 0, exports: exportsArr };
  }

  return { ok: true };
}

// ---------------------------------------------------------
// BUILD TREE (FULL RECURSIVE SCAN)
// ---------------------------------------------------------

function buildNode(fullPath: string): DiagnosticNode {
  const name = path.basename(fullPath);
  const exists = fs.existsSync(fullPath);

  if (!exists) {
    return {
      name,
      fullPath,
      exists: false,
      status: chalk.red("MISSING"),
    };
  }

  const stat = fs.statSync(fullPath);

  // FOLDER
  if (stat.isDirectory()) {
    const children = fs
      .readdirSync(fullPath)
      .map((entry) => buildNode(path.join(fullPath, entry)));

    return {
      name,
      fullPath,
      exists: true,
      status: chalk.green("OK"),
      children,
    };
  }

  // FILE
  const validation = validateFile(fullPath);
  const status = validation.ok
    ? chalk.green("OK")
    : chalk.red("BROKEN EXPORTS");

  return {
    name,
    fullPath,
    exists: true,
    status,
    exports: validation.exports,
  };
}

// ---------------------------------------------------------
// RENDER TREE
// ---------------------------------------------------------

function renderNode(node: DiagnosticNode, indent = ""): string {
  const bullet = node.exists
    ? node.status.includes("OK")
      ? OK
      : FAIL
    : FAIL;

  let line = `${indent}${bullet} ${node.name}  (${node.status})`;

  // Show export list
  if (node.exports && node.exports.length) {
    line += `  → exports: [${node.exports.join(", ")}]`;
  }

  if (node.children && node.children.length > 0) {
    const sub = node.children
      .map((child) => renderNode(child, indent + "  "))
      .join("\n");
    return `${line}\n${sub}`;
  }

  return line;
}

// ---------------------------------------------------------
// RUN FULL DIAGNOSTICS
// ---------------------------------------------------------

export function runDiagnostics() {
  console.log(chalk.cyan("\n=== HI-CURV FULL SYSTEM DIAGNOSTICS ===\n"));

  const srcRoot = path.resolve(ROOT, "src");

  const tree = buildNode(srcRoot);

  console.log(chalk.magenta("TREE:\n"));
  console.log(renderNode(tree));

  // Pipeline summary
  const broken = findBroken(tree);

  console.log(chalk.magenta("\nPIPELINE SUMMARY:\n"));

  if (broken.length === 0) {
    console.log(chalk.green("FULL ENGINE PIPELINE: ✔ All systems OK\n"));
  } else {
    console.log(chalk.red("FULL ENGINE PIPELINE: ✗ BROKEN\n"));
    console.log(chalk.red("Issues:"));
    broken.forEach((b) => console.log(` - ${b}`));
  }

  console.log("\nDone.\n");
}

// ---------------------------------------------------------
// FIND ALL BROKEN NODES
// ---------------------------------------------------------

function findBroken(node: DiagnosticNode, list: string[] = []): string[] {
  if (!node.exists) list.push(`${node.fullPath} (missing)`);

  if (node.status.includes("BROKEN")) {
    list.push(`${node.fullPath} (exports invalid)`);
  }

  if (node.children) {
    node.children.forEach((c) => findBroken(c, list));
  }

  return list;
}

