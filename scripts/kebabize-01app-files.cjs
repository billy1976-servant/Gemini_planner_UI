const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const APP_ROOT = path.join(ROOT, "src", "01_App");
const CODE_EXTS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];
const SCAN_ROOTS = [path.join(ROOT, "src"), path.join(ROOT, "scripts")];

function toPosix(p) {
  return p.split(path.sep).join("/");
}

function toKebabBase(base) {
  return base
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .replace(/[_\s]+/g, "-")
    .replace(/--+/g, "-")
    .toLowerCase();
}

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      walk(full, out);
    } else {
      out.push(full);
    }
  }
  return out;
}

function isCodeFile(file) {
  return CODE_EXTS.includes(path.extname(file).toLowerCase());
}

function existsAsFile(absNoExt) {
  for (const ext of CODE_EXTS.concat([".json"])) {
    const p = absNoExt + ext;
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
  }
  if (fs.existsSync(absNoExt) && fs.statSync(absNoExt).isFile()) return absNoExt;
  return null;
}

function resolveSpecifier(importerAbs, spec) {
  if (spec.startsWith("@/")) {
    const absNoExt = path.join(ROOT, "src", spec.slice(2));
    return existsAsFile(absNoExt);
  }
  if (spec.startsWith("./") || spec.startsWith("../")) {
    const absNoExt = path.resolve(path.dirname(importerAbs), spec);
    return existsAsFile(absNoExt);
  }
  return null;
}

const allAppFiles = walk(APP_ROOT).filter((f) => isCodeFile(f) || path.extname(f).toLowerCase() === ".json");
const renameMap = new Map(); // oldAbs -> newAbs
const renamed = [];
const skipped = [];

for (const oldAbs of allAppFiles) {
  const dir = path.dirname(oldAbs);
  const ext = path.extname(oldAbs);
  const base = path.basename(oldAbs, ext);
  const kebab = toKebabBase(base);
  if (kebab === base) continue;
  const newAbs = path.join(dir, kebab + ext);
  if (fs.existsSync(newAbs)) {
    skipped.push({ old: toPosix(path.relative(ROOT, oldAbs)), new: toPosix(path.relative(ROOT, newAbs)), reason: "target-exists" });
    continue;
  }
  renameMap.set(oldAbs, newAbs);
}

// Rename files with temp hop for Windows case-insensitive safety.
for (const [oldAbs, newAbs] of renameMap.entries()) {
  const tmp = oldAbs + ".__tmp_kebab__";
  fs.renameSync(oldAbs, tmp);
  fs.renameSync(tmp, newAbs);
  renamed.push({ old: toPosix(path.relative(ROOT, oldAbs)), new: toPosix(path.relative(ROOT, newAbs)) });
}

function rewriteCodeFile(file) {
  let src = fs.readFileSync(file, "utf8");
  let changed = false;
  const re = /((?:import|export)\s[^'"]*?\sfrom\s*|import\s*\()\s*(['"])([^'"]+)\2/g;
  src = src.replace(re, (m, lead, q, spec) => {
    const resolved = resolveSpecifier(file, spec);
    if (!resolved) return m;
    const target = renameMap.get(resolved);
    if (!target) return m;

    let nextSpec = spec;
    if (spec.startsWith("@/")) {
      const relFromSrc = toPosix(path.relative(path.join(ROOT, "src"), target)).replace(/\.(tsx?|jsx?|mjs|cjs|json)$/i, "");
      nextSpec = `@/${relFromSrc}`;
    } else {
      let rel = toPosix(path.relative(path.dirname(file), target)).replace(/\.(tsx?|jsx?|mjs|cjs|json)$/i, "");
      if (!rel.startsWith(".")) rel = "./" + rel;
      nextSpec = rel;
    }
    changed = true;
    return `${lead}${q}${nextSpec}${q}`;
  });

  if (changed) fs.writeFileSync(file, src, "utf8");
  return changed;
}

let updatedImportsFiles = 0;
for (const root of SCAN_ROOTS) {
  if (!fs.existsSync(root)) continue;
  for (const f of walk(root)) {
    if (!isCodeFile(f)) continue;
    if (rewriteCodeFile(f)) updatedImportsFiles += 1;
  }
}

const report = {
  renamedCount: renamed.length,
  updatedImportFiles: updatedImportsFiles,
  skippedCount: skipped.length,
  renamed,
  skipped,
};
fs.writeFileSync(path.join(ROOT, "scripts", "kebabize-01app-files.report.json"), JSON.stringify(report, null, 2), "utf8");
console.log(`renamed=${renamed.length} updatedImportFiles=${updatedImportsFiles} skipped=${skipped.length}`);
