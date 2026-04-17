const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const O1_APP = path.join(ROOT, "src", "01_App");
const PUBLIC_DIR = path.join(ROOT, "public");
const MEDIA_EXT_RE = /\.(mp4|webm|mov|jpg|jpeg|png|webp|gif|svg)$/i;
const DOUBLE_EXT_RE = /(\.mp4|\.webm|\.mov|\.jpg|\.jpeg|\.png|\.webp|\.gif|\.svg)\1$/i;

function walkLearnFlowRoots(startDir) {
  const out = [];
  function walk(dir) {
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const full = path.join(dir, entry.name);
      if (path.basename(path.dirname(full)) === "learn") {
        out.push(full);
        continue;
      }
      walk(full);
    }
  }
  walk(startDir);
  return out;
}

function collectMediaRefs(node, out) {
  if (node == null) return;
  if (Array.isArray(node)) {
    for (const v of node) collectMediaRefs(v, out);
    return;
  }
  if (typeof node !== "object") return;
  for (const [k, v] of Object.entries(node)) {
    if (typeof v === "string" && ["src", "poster", "logoSrc", "before", "after"].includes(k)) {
      out.push({ key: k, value: v });
    }
    collectMediaRefs(v, out);
  }
}

function checkPublicPath(urlPath) {
  const withoutQuery = urlPath.split("?")[0].trim();
  if (!withoutQuery.startsWith("/")) {
    return { exists: false, caseMismatch: false };
  }
  const normalized = withoutQuery.replace(/^\/+/, "");
  let decoded = normalized;
  try {
    decoded = decodeURIComponent(normalized);
  } catch {
    // keep raw
  }
  const segments = decoded.split("/").filter(Boolean);
  let current = PUBLIC_DIR;
  for (const seg of segments) {
    let entries = [];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      return { exists: false, caseMismatch: false };
    }
    const exact = entries.find((e) => e.name === seg);
    if (exact) {
      current = path.join(current, exact.name);
      continue;
    }
    const caseInsensitive = entries.find((e) => e.name.toLowerCase() === seg.toLowerCase());
    if (caseInsensitive) {
      return { exists: true, caseMismatch: true };
    }
    return { exists: false, caseMismatch: false };
  }
  return { exists: fs.existsSync(current), caseMismatch: false };
}

function getVersionFiles(flowRoot) {
  let entries = [];
  try {
    entries = fs.readdirSync(flowRoot, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries
    .filter((e) => e.isFile() && e.name.endsWith(".json") && e.name.toLowerCase() !== "manifest.json")
    .map((e) => path.join(flowRoot, e.name));
}

function audit() {
  const issues = [];
  const flowRoots = walkLearnFlowRoots(O1_APP);
  for (const flowRoot of flowRoots) {
    for (const filePath of getVersionFiles(flowRoot)) {
      const rel = path.relative(ROOT, filePath);
      let data;
      try {
        data = JSON.parse(fs.readFileSync(filePath, "utf8"));
      } catch (err) {
        issues.push({ file: rel, type: "invalid_json", value: String(err) });
        continue;
      }
      const refs = [];
      collectMediaRefs(data, refs);
      for (const ref of refs) {
        const value = String(ref.value || "").trim();
        if (!value) continue;
        if (/^(https?:|data:|blob:)/i.test(value)) continue;
        const base = value.split("?")[0];
        const looksLikeMedia = MEDIA_EXT_RE.test(base) || DOUBLE_EXT_RE.test(base);
        if (!looksLikeMedia) continue;

        if (DOUBLE_EXT_RE.test(base)) {
          issues.push({ file: rel, type: "double_extension", value });
        }
        if (/^\/(Videos|Images)\//.test(value)) {
          issues.push({ file: rel, type: "legacy_folder_casing", value });
        }
        if (/%20|\s/.test(value)) {
          issues.push({ file: rel, type: "space_or_encoded_space", value });
        }
        if (value.startsWith("/")) {
          const check = checkPublicPath(value);
          if (!check.exists) {
            issues.push({ file: rel, type: "missing_public_file", value });
          } else if (check.caseMismatch) {
            issues.push({ file: rel, type: "public_case_mismatch", value });
          }
        }
      }
    }
  }
  return issues;
}

const issues = audit();
if (issues.length === 0) {
  console.log("verify-learn-media-paths: ok");
  process.exit(0);
}

console.error(`verify-learn-media-paths: found ${issues.length} issue(s)`);
for (const issue of issues) {
  console.error(`- ${issue.file} [${issue.type}] ${issue.value}`);
}
process.exit(1);
