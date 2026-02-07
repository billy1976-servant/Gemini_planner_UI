/**
 * Path resolution validator — ensures tsconfig paths, require.context roots,
 * and next.config webpack aliases align with physical folders.
 * Run before builds to prevent path drift.
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

// 1) TSConfig paths: apps-tsx and apps-json
const tsconfigPath = path.join(ROOT, "tsconfig.json");
if (!fs.existsSync(tsconfigPath)) {
  console.error("FAIL: tsconfig.json not found");
  process.exit(1);
}

const tsconfigRaw = fs.readFileSync(tsconfigPath, "utf8");
// Extract paths and baseUrl without full parse (tsconfig may contain comments)
const baseUrlMatch = tsconfigRaw.match(/"baseUrl"\s*:\s*"([^"]*)"/);
const baseUrl = baseUrlMatch ? baseUrlMatch[1] : ".";
const baseResolved = path.resolve(ROOT, baseUrl);

const paths = {};
const pathMatches = tsconfigRaw.matchAll(/"(@\/[^"]+)"\s*:\s*\["([^"]*)"/g);
for (const m of pathMatches) paths[m[1]] = [m[2]];

const appsTsx = (paths["@/apps-tsx"]?.[0] ?? paths["@/apps-tsx/*"]?.[0]?.replace(/\/\*$/, "")) || "";
const appsJson = (paths["@/apps-json"]?.[0] ?? paths["@/apps-json/*"]?.[0]?.replace(/\/\*$/, "")) || "";

check(
  "tsconfig: @/apps-tsx entry",
  paths["@/apps-tsx"] && paths["@/apps-tsx/*"],
  "tsconfig must have both \"@/apps-tsx\" and \"@/apps-tsx/*\" in paths"
);
check(
  "tsconfig: @/apps-json entry",
  paths["@/apps-json"] && paths["@/apps-json/*"],
  "tsconfig must have both \"@/apps-json\" and \"@/apps-json/*\" in paths"
);

if (appsTsx) {
  const dir = path.resolve(baseResolved, appsTsx);
  check("tsconfig: apps-tsx folder exists", fs.existsSync(dir) && fs.statSync(dir).isDirectory(), `directory does not exist: ${dir}`);
}
if (appsJson) {
  const dir = path.resolve(baseResolved, appsJson);
  check("tsconfig: apps-json folder exists", fs.existsSync(dir) && fs.statSync(dir).isDirectory(), `directory does not exist: ${dir}`);
}

// 2) require.context roots
// page.tsx: "../apps-tsx" from src/app/ → src/apps-tsx
const pageTsxPath = path.join(ROOT, "src", "app", "page.tsx");
const pageContent = fs.existsSync(pageTsxPath) ? fs.readFileSync(pageTsxPath, "utf8") : "";
const pageUsesCorrectContext = /(?:require\s+as\s+any\s*)?\.context\s*\(\s*["']\.\.\/apps-tsx["']/.test(pageContent);
check(
  "require.context: page.tsx uses ../apps-tsx",
  pageUsesCorrectContext,
  "src/app/page.tsx must use require.context(\"../apps-tsx\", ...)"
);
check(
  "require.context: page.tsx target exists",
  fs.existsSync(resolveDir("src", "apps-tsx")),
  "src/apps-tsx must exist"
);

// safe-json-loader: "../../apps-json/apps" from src/apps-tsx/utils/ → src/apps-json/apps
const safeLoaderPath = path.join(ROOT, "src", "apps-tsx", "utils", "safe-json-loader.ts");
const safeLoaderContent = fs.existsSync(safeLoaderPath) ? fs.readFileSync(safeLoaderPath, "utf8") : "";
const safeLoaderUsesAppsJson = /require\.context\s*\(\s*["']\.\.\/\.\.\/apps-json\/apps["']/.test(safeLoaderContent);
check(
  "require.context: safe-json-loader uses ../../apps-json/apps",
  safeLoaderUsesAppsJson,
  "safe-json-loader must use require.context(\"../../apps-json/apps\", ...)"
);
check(
  "require.context: apps-json/apps exists",
  fs.existsSync(resolveDir("src", "apps-json", "apps")),
  "src/apps-json/apps must exist"
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
