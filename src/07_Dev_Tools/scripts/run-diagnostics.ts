import fs from "fs";
import path from "path";
import chalk from "chalk";

// --------------------------------------------------
// ROOT
// --------------------------------------------------
const ROOT = path.resolve(__dirname, "..", "..", "src");

// Colors
const OK = chalk.green("✓");
const FAIL = chalk.red("✗");
const IMP = chalk.cyan;      // imports
const EXP = chalk.yellow;    // exports
const BROKEN = chalk.red.bold;

// Priority sorting – engine first, low-level last
const PRIORITY_ORDER = [
  "engine",
  "behavior",
  "components",
  "compounds",
  "content",
  "interpreter",
  "modules",
  "progression",
  "semantics",
  "sequences",
  "timecore",
  "screens",
  "lib",
  "scripts",
  "app",
  "ui",
  "ux",
  "system",
];

// --------------------------------------------------
// TYPES
// --------------------------------------------------
interface NodeInfo {
  name: string;
  fullPath: string;
  exists: boolean;
  status: string;
  imports?: string[];
  exports?: string[];
  missingImports?: string[];
  children?: NodeInfo[];
}

// --------------------------------------------------
// CODE PARSING
// --------------------------------------------------
function parseCode(file: string): { imports: string[]; exports: string[] } {
  try {
    const content = fs.readFileSync(file, "utf8");
    const imports = Array.from(
      content.matchAll(/import\s+[^'"]*['"]([^'"]+)['"]/g)
    ).map((m) => m[1]);
    const exports = Array.from(
      content.matchAll(
        /export\s+(?:const|function|class|type|interface)\s+([A-Za-z0-9_]+)/g
      )
    ).map((m) => m[1]);
    return { imports, exports };
  } catch {
    return { imports: [], exports: [] };
  }
}

// Try to resolve a relative import on disk
function resolveRelativeImport(fromFile: string, spec: string): boolean {
  if (!spec.startsWith(".")) {
    // bare import like 'react' – ignore, don't treat as broken
    return true;
  }
  const baseDir = path.dirname(fromFile);
  const base = path.resolve(baseDir, spec);
  const candidates = [
    base,
    base + ".ts",
    base + ".tsx",
    base + ".json",
    path.join(base, "index.ts"),
    path.join(base, "index.tsx"),
    path.join(base, "index.json"),
  ];
  return candidates.some((p) => fs.existsSync(p));
}

// --------------------------------------------------
// SCAN NODE
// --------------------------------------------------
function scan(fullPath: string): NodeInfo {
  const name = path.basename(fullPath);

  if (!fs.existsSync(fullPath)) {
    return {
      name,
      fullPath,
      exists: false,
      status: BROKEN("MISSING"),
    };
  }

  const stat = fs.statSync(fullPath);

  // -------- Folder --------
  if (stat.isDirectory()) {
    let children = fs.readdirSync(fullPath).map((e) =>
      scan(path.join(fullPath, e))
    );

    // Priority sort
    children = children.sort((a, b) => {
      const pa = PRIORITY_ORDER.indexOf(a.name);
      const pb = PRIORITY_ORDER.indexOf(b.name);
      if (pa === -1 && pb === -1) return a.name.localeCompare(b.name);
      if (pa === -1) return 1;
      if (pb === -1) return -1;
      return pa - pb;
    });

    return {
      name,
      fullPath,
      exists: true,
      status: OK,
      children,
    };
  }

  // -------- File --------
  const ext = path.extname(fullPath);
  const isCode = [".ts", ".tsx"].includes(ext);
  const isIgnored = [".json", ".md", ".css"].includes(ext);

  if (!isCode && !isIgnored) {
    return {
      name,
      fullPath,
      exists: true,
      status: OK,
    };
  }

  let imports: string[] = [];
  let exportsArr: string[] = [];
  let missingImports: string[] = [];

  if (isCode) {
    const result = parseCode(fullPath);
    imports = result.imports;
    exportsArr = result.exports;

    // only mark broken if a RELATIVE import cannot be resolved
    missingImports = imports.filter(
      (spec) => !resolveRelativeImport(fullPath, spec)
    );
  }

  const broken = isCode && missingImports.length > 0;

  return {
    name,
    fullPath,
    exists: true,
    status: broken ? BROKEN("BROKEN") : OK,
    imports,
    exports: exportsArr,
    missingImports,
  };
}

// --------------------------------------------------
// RENDER TREE
// --------------------------------------------------
function render(node: NodeInfo, indent = ""): string {
  const bullet = node.status.includes("✓") ? OK : FAIL;
  let out = `${indent}${bullet} ${node.name} (${node.status})`;
  if (node.children && node.children.length) {
    out +=
      "\n" + node.children.map((c) => render(c, indent + "   ")).join("\n");
  }
  return out;
}

// --------------------------------------------------
// COLLECT / FLATTEN
// --------------------------------------------------
function flatten(node: NodeInfo, list: NodeInfo[] = []) {
  list.push(node);
  if (node.children) node.children.forEach((c) => flatten(c, list));
  return list;
}

function shortPath(full: string) {
  const i = full.indexOf("/src/");
  return i === -1 ? full : full.substring(i + 5);
}

// --------------------------------------------------
// MAIN
// --------------------------------------------------
console.log(chalk.cyan("\n=== HI-CURV SYSTEM DIAGNOSTICS ===\n"));

// --- TREE OUTPUT ---
const tree = scan(ROOT);
console.log(chalk.magenta("TREE:\n"));
console.log(render(tree));

// --- SUMMARY ---
console.log(chalk.magenta("\nSUMMARY:\n"));
const allFiles = flatten(tree).filter((n) => !n.children && n.exists);
const goodFiles = allFiles.filter((f) => f.status.includes("✓"));
const badFiles = allFiles.filter((f) => !f.status.includes("✓"));

// top-level health:
const sections = [
  "engine",
  "behavior",
  "components",
  "compounds",
  "content",
  "interpreter",
  "modules",
  "progression",
  "semantics",
  "sequences",
  "timecore",
  "screens",
  "scripts",
  "app",
  "ui",
  "ux",
  "system",
  "lib",
];

sections.forEach((section) => {
  const hasBad = badFiles.some((f) =>
    shortPath(f.fullPath).startsWith(section)
  );
  const label = hasBad ? FAIL : OK;
  console.log(`${label} ${section}`);
});

// --------------------------------------------------
// DETAILED BREAKDOWN
// --------------------------------------------------
console.log(chalk.magenta("\n=== DETAILED BREAKDOWN ===\n"));

// GOOD FILES
console.log(chalk.green("✓ GOOD FILES\n--------------------------------"));
goodFiles.forEach((f) => {
  console.log(chalk.green(shortPath(f.fullPath)));
  if (f.imports && f.imports.length) {
    console.log(`  ${IMP("imports:")} [${f.imports.join(", ")}]`);
  }
  if (f.exports && f.exports.length) {
    console.log(`  ${EXP("exports:")} [${f.exports.join(", ")}]`);
  }
  console.log("");
});

// BROKEN FILES
console.log(chalk.red("✗ BROKEN FILES\n--------------------------------"));
badFiles.forEach((f) => {
  console.log(chalk.red(shortPath(f.fullPath)));
  if (f.imports && f.imports.length) {
    console.log(`  ${IMP("imports:")} [${f.imports.join(", ")}]`);
  }
  if (f.exports && f.exports.length) {
    console.log(`  ${EXP("exports:")} [${f.exports.join(", ")}]`);
  }
  if (f.missingImports && f.missingImports.length) {
    console.log(
      `  ${chalk.red("missing imports:")} [${f.missingImports.join(", ")}]`
    );
  }
  console.log("");
});

// --------------------------------------------------
// FINAL SIGNAL (A–G STYLE, REAL COUNTS)
// --------------------------------------------------
const codeFiles = allFiles.filter((f) => {
  const ext = path.extname(f.fullPath);
  return ext === ".ts" || ext === ".tsx";
}).length;

console.log(chalk.magenta("\n=== FINAL SIGNAL ==="));

if (badFiles.length === 0) {
  // All good: signature A–G with counts so you can trust it
  console.log(
    chalk.bgGreen.black(
      ` A B C D E F G  |  code files: ${codeFiles}, broken: 0 `
    )
  );
} else {
  // Something is broken: show exact numbers
  console.log(
    chalk.bgRed.white(
      ` BROKEN IMPORTS  |  code files: ${codeFiles}, broken: ${badFiles.length} `
    )
  );
}

console.log("\n");
