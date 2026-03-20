const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");
const CODE_EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const TRY_EXTS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json"];

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name === ".next" || e.name === ".git") continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

function resolveSpec(importer, spec) {
  let base;
  if (spec.startsWith("@/")) base = path.join(SRC, spec.slice(2));
  else if (spec.startsWith("./") || spec.startsWith("../")) base = path.resolve(path.dirname(importer), spec);
  else return { ok: true, reason: "external" };

  if (fs.existsSync(base) && fs.statSync(base).isFile()) return { ok: true, path: base };
  for (const ext of TRY_EXTS) {
    const p = base + ext;
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return { ok: true, path: p };
  }
  for (const ext of TRY_EXTS) {
    const p = path.join(base, "index" + ext);
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return { ok: true, path: p };
  }
  return { ok: false, triedBase: base };
}

const importRe = /(?:import\s+[^'"]*?\sfrom\s*|import\s*\()\s*(['"])([^'"]+)\1/g;
const targets = ["@/01_App/hiclarify/", "@/01_App/containercreations/"];
const broken = [];

for (const f of walk(SRC)) {
  if (!CODE_EXTS.has(path.extname(f))) continue;
  const s = fs.readFileSync(f, "utf8");
  let m;
  while ((m = importRe.exec(s))) {
    const spec = m[2];
    if (!targets.some((t) => spec.startsWith(t))) continue;
    const r = resolveSpec(f, spec);
    if (!r.ok) broken.push({ file: path.relative(ROOT, f).replace(/\\/g, "/"), spec });
  }
}

const unique = [];
const seen = new Set();
for (const b of broken) {
  const k = `${b.file}::${b.spec}`;
  if (seen.has(k)) continue;
  seen.add(k);
  unique.push(b);
}
fs.writeFileSync(path.join(ROOT, "scripts", "hiclarify-containercreations-imports.report.json"), JSON.stringify(unique, null, 2), "utf8");
console.log(`broken=${unique.length}`);
