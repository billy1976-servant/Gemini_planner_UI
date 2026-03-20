const fs = require("fs");
const path = require("path");

const ROOT = path.join(process.cwd(), "src", "01_App");
const renamed = [];
const skipped = [];

function hasUpper(s) {
  return /[A-Z]/.test(s);
}

function listAll(start) {
  const out = [];
  const stack = [start];
  while (stack.length) {
    const dir = stack.pop();
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, ent.name);
      out.push(full);
      if (ent.isDirectory()) stack.push(full);
    }
  }
  // deepest first so children are renamed before parents
  out.sort((a, b) => b.split(path.sep).length - a.split(path.sep).length);
  return out;
}

function safeRename(oldPath, newPath) {
  if (oldPath === newPath) return;
  if (fs.existsSync(newPath)) {
    skipped.push({ oldPath, newPath, reason: "target-exists" });
    return;
  }
  const tempPath = `${oldPath}.__tmp_casefix__`;
  fs.renameSync(oldPath, tempPath);
  fs.renameSync(tempPath, newPath);
  renamed.push({ oldPath, newPath });
}

for (const full of listAll(ROOT)) {
  const rel = path.relative(ROOT, full);
  if (!rel || rel.startsWith("..")) continue;
  const parent = path.dirname(full);
  const base = path.basename(full);
  if (!hasUpper(base)) continue;
  const lowerBase = base.toLowerCase();
  const target = path.join(parent, lowerBase);
  safeRename(full, target);
}

const report = { renamedCount: renamed.length, skippedCount: skipped.length, renamed, skipped };
fs.writeFileSync(path.join(process.cwd(), "scripts", "lowercase-01app-paths.report.json"), JSON.stringify(report, null, 2), "utf8");
console.log(`renamed=${renamed.length} skipped=${skipped.length}`);
