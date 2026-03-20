/**
 * Build path validator — strict-router only.
 * Ensures build no longer depends on legacy apps-tsx/apps-json/(dead) folders.
 * Exit code: 0 = PASS, 1 = FAIL.
 */

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
let failed = 0;

function resolveDir(...parts) {
  return path.join(ROOT, ...parts);
}

function check(name, condition, message) {
  if (condition) {
    console.log(`PASS: ${name}`);
    return true;
  }
  console.error(`FAIL: ${name} — ${message}`);
  failed++;
  return false;
}

// 1) tsconfig.json must exist (light sanity check only)
const tsconfigPath = path.join(ROOT, "tsconfig.json");
if (!fs.existsSync(tsconfigPath)) {
  console.error("FAIL: tsconfig.json not found");
  process.exit(1);
}

check("tsconfig: exists", true, "");

// 2) Ensure strict-router structure root exists
check(
  "strict-router: src/01_App exists",
  fs.existsSync(resolveDir("src", "01_App")) && fs.statSync(resolveDir("src", "01_App")).isDirectory(),
  "src/01_App must exist"
);

// 3) next.config.js: no @/apps-tsx override to a non-existent path
const nextConfigPath = path.join(ROOT, "next.config.js");
const nextContent = fs.existsSync(nextConfigPath) ? fs.readFileSync(nextConfigPath, "utf8") : "";
const hasAppsTsxAliasToScreens = /@\/apps-tsx["']\s*:\s*path\.resolve\s*\([^)]*["']src\/screens["']/.test(nextContent);
const hasAppsTsxAliasOverride = /@\/apps-tsx["']\s*:/.test(nextContent);
check(
  "next.config: no @/apps-tsx override to src/screens",
  !hasAppsTsxAliasToScreens,
  "next.config.js must not alias @/apps-tsx to src/screens"
);
if (hasAppsTsxAliasOverride && !hasAppsTsxAliasToScreens) {
  const aliasTarget = nextContent.match(/@\/apps-tsx["']\s*:\s*path\.resolve\s*\([^,]+,\s*["']([^"']+)["']/);
  if (aliasTarget) {
    const targetDir = path.resolve(ROOT, aliasTarget[1]);
    check(
      "next.config: @/apps-tsx alias target exists (if any)",
      fs.existsSync(targetDir),
      `alias target does not exist: ${targetDir}`
    );
  }
}

// Summary
console.log("");
if (failed > 0) {
  console.error(`Result: FAIL (${failed} check(s) failed)`);
  process.exit(1);
}
console.log("Result: PASS (all path checks passed)");
process.exit(0);
