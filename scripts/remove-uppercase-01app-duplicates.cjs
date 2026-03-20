const fs = require("fs");
const path = require("path");

const reportPath = path.join(process.cwd(), "scripts", "lowercase-01app-paths.report.json");
const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));

const removed = [];
const failed = [];

function removePath(p) {
  try {
    if (!fs.existsSync(p)) return;
    const st = fs.lstatSync(p);
    if (st.isDirectory()) {
      fs.rmSync(p, { recursive: true, force: true });
    } else {
      fs.unlinkSync(p);
    }
    removed.push(p);
  } catch (e) {
    failed.push({ path: p, error: String(e && e.message ? e.message : e) });
  }
}

// deepest-first
const toRemove = report.skipped
  .filter((s) => s.reason === "target-exists")
  .map((s) => s.oldPath)
  .sort((a, b) => b.split(path.sep).length - a.split(path.sep).length);

for (const p of toRemove) removePath(p);

const out = { removedCount: removed.length, failedCount: failed.length, removed, failed };
fs.writeFileSync(path.join(process.cwd(), "scripts", "remove-uppercase-01app-duplicates.report.json"), JSON.stringify(out, null, 2), "utf8");
console.log(`removed=${removed.length} failed=${failed.length}`);
