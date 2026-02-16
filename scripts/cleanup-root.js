const fs = require("fs");
const path = require("path");

const root = process.cwd();

const KEEP_IN_ROOT = new Set([
  "src",
  "public",
  "scripts",
  "package.json",
  "package-lock.json",
  "next.config.js",
  "vite.config.js",
  "index.html",
  ".env",
  ".env.local",
  ".env.example",
  ".env.local.example",
  ".gitignore",
  "sw.js",
  "vercel.json"
]);

const CLEAN_ROOT = path.join(root, "_CLEAN_ROOT");

const BUCKETS = {
  docs: path.join(CLEAN_ROOT, "docs"),
  configs: path.join(CLEAN_ROOT, "configs"),
  env: path.join(CLEAN_ROOT, "env"),
  misc: path.join(CLEAN_ROOT, "misc")
};

function ensure(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

Object.values(BUCKETS).forEach(ensure);

const files = fs.readdirSync(root);

for (const file of files) {
  if (KEEP_IN_ROOT.has(file)) continue;
  if (file.startsWith(".")) continue; // keep hidden system folders
  if (file === "_CLEAN_ROOT") continue;

  const full = path.join(root, file);
  const stat = fs.statSync(full);

  if (stat.isDirectory()) continue;

  let target;

  if (file.endsWith(".md") || file.endsWith(".txt")) {
    target = BUCKETS.docs;
  } else if (file.endsWith(".env") || file.includes("env")) {
    target = BUCKETS.env;
  } else if (
    file.endsWith(".config.js") ||
    file.endsWith(".config.ts") ||
    file.endsWith(".json") ||
    file.endsWith(".ts")
  ) {
    target = BUCKETS.configs;
  } else {
    target = BUCKETS.misc;
  }

  const dest = path.join(target, file);

  try {
    fs.renameSync(full, dest);
    console.log("[cleanup] moved:", file);
  } catch (e) {}
}

console.log("\nRoot consolidation complete.");
