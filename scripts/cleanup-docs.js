/**
 * cleanup-docs.js — Docs index refresh only.
 * - Ensures START_HERE.md exists
 * - Ensures PLANS_INDEX.md links MAP.md and PLAN_ACTIVE.md
 * - Writes "Last refreshed: <iso>" at top of MAP.md
 * Does NOT scan the entire repo; keeps it tiny and cheap.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const HI_SYSTEM = path.join(ROOT, "docs", "HI_SYSTEM");

function ensureStartHere() {
  if (!fs.existsSync(HI_SYSTEM)) {
    fs.mkdirSync(HI_SYSTEM, { recursive: true });
  }
  const startHere = path.join(HI_SYSTEM, "START_HERE.md");
  if (!fs.existsSync(startHere)) {
    fs.writeFileSync(startHere, "# If you're new, read this\n\nRun `npm run cleanup` and see docs/HI_SYSTEM/.\n", "utf8");
    console.log("[cleanup-docs] Created START_HERE.md");
  }
}

function ensurePlansIndexLinks() {
  const indexPath = path.join(HI_SYSTEM, "PLANS_INDEX.md");
  if (!fs.existsSync(indexPath)) return;
  const content = fs.readFileSync(indexPath, "utf8");
  const hasMap = content.includes("MAP.md");
  const hasPlanActive = content.includes("PLAN_ACTIVE.md");
  if (!hasMap || !hasPlanActive) {
    const append = "\n\n- [MAP.md](MAP.md)\n- [PLAN_ACTIVE.md](PLAN_ACTIVE.md)\n";
    fs.appendFileSync(indexPath, append, "utf8");
    console.log("[cleanup-docs] Appended MAP.md and PLAN_ACTIVE.md links to PLANS_INDEX.md");
  }
}

function writeMapTimestamp() {
  const mapPath = path.join(HI_SYSTEM, "MAP.md");
  if (!fs.existsSync(mapPath)) return;
  const stamp = "Last refreshed: " + new Date().toISOString();
  let content = fs.readFileSync(mapPath, "utf8");
  if (/^Last refreshed: .+$/m.test(content)) {
    content = content.replace(/^Last refreshed: .+$/m, stamp);
  } else {
    content = stamp + "\n\n" + content;
  }
  fs.writeFileSync(mapPath, content, "utf8");
  console.log("[cleanup-docs] Updated MAP.md timestamp");
}

ensureStartHere();
ensurePlansIndexLinks();
writeMapTimestamp();
console.log("[cleanup-docs] Done.");
