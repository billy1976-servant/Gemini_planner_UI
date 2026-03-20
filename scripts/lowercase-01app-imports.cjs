const fs = require("fs");
const path = require("path");

const ROOT = path.join(process.cwd(), "src");
const EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === ".git" || entry.name === "node_modules" || entry.name === ".next") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    if (!EXTS.has(path.extname(entry.name).toLowerCase())) continue;
    const src = fs.readFileSync(full, "utf8");
    const out = src.replace(/(["'`])@\/01_App\/(.+?)\1/g, (_m, q, rest) => `${q}@/01_App/${rest.toLowerCase()}${q}`);
    if (out !== src) fs.writeFileSync(full, out, "utf8");
  }
}

walk(ROOT);
