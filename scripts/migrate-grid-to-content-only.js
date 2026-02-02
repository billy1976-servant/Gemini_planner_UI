/**
 * Migration: rewrite JSON files that contain "type":"Grid" (or Row/Column/Stack)
 * into content-only shape. Layout becomes params.moleculeLayout on the parent;
 * layout node is replaced by its children.
 *
 * Usage: node scripts/migrate-grid-to-content-only.js [--dry-run]
 * Targets: src/organs/**/variants/*.json, src/apps-offline/**/*.json
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DRY_RUN = process.argv.includes("--dry-run");

const LAYOUT_NODE_TYPES = new Set(["Grid", "Row", "Column", "Stack"]);

function isLayoutNode(node) {
  if (!node || typeof node !== "object") return false;
  const t = node.type;
  return typeof t === "string" && LAYOUT_NODE_TYPES.has(t);
}

function collapseLayoutNodes(node) {
  if (!node || typeof node !== "object") return node;
  const n = { ...node };
  if (!Array.isArray(n.children) || n.children.length === 0) return n;

  const newChildren = [];
  for (const child of n.children) {
    if (isLayoutNode(child)) {
      const layoutType = (child.layout && child.layout.type) || (child.type && child.type.toLowerCase()) || "grid";
      const layoutParams = (child.layout && child.layout.params) || {};
      n.params = {
        ...(n.params && typeof n.params === "object" ? n.params : {}),
        moleculeLayout: { type: layoutType, preset: null, params: layoutParams },
      };
      const grandChildren = Array.isArray(child.children) ? child.children : [];
      for (const gc of grandChildren) {
        newChildren.push(collapseLayoutNodes(gc));
      }
    } else {
      newChildren.push(collapseLayoutNodes(child));
    }
  }
  n.children = newChildren;
  return n;
}

function hasLayoutNodeType(node) {
  if (!node || typeof node !== "object") return false;
  if (typeof node.type === "string" && LAYOUT_NODE_TYPES.has(node.type)) return true;
  if (Array.isArray(node.children)) {
    for (const c of node.children) {
      if (hasLayoutNodeType(c)) return true;
    }
  }
  return false;
}

function findJsonFiles(dir, pattern, list = []) {
  if (!fs.existsSync(dir)) return list;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      findJsonFiles(full, pattern, list);
    } else if (e.isFile() && e.name.endsWith(".json")) {
      const rel = path.relative(ROOT, full);
      if (pattern.test(rel)) list.push(full);
    }
  }
  return list;
}

function main() {
  const organsVariants = findJsonFiles(path.join(ROOT, "src", "organs"), /variants[\\/].+\.json$/);
  const appsOffline = findJsonFiles(path.join(ROOT, "src", "apps-offline"), /\.json$/);
  const all = [...organsVariants, ...appsOffline];

  let migrated = 0;
  for (const filePath of all) {
    let content;
    try {
      content = fs.readFileSync(filePath, "utf8");
    } catch (err) {
      console.warn("[migrate] Skip (read):", filePath, err.message);
      continue;
    }
    let data;
    try {
      data = JSON.parse(content);
    } catch (err) {
      console.warn("[migrate] Skip (parse):", filePath, err.message);
      continue;
    }
    if (!hasLayoutNodeType(data)) continue;

    const collapsed = collapseLayoutNodes(data);
    const out = JSON.stringify(collapsed, null, 2);
    if (DRY_RUN) {
      console.log("[migrate] Would rewrite:", path.relative(ROOT, filePath));
      migrated++;
      continue;
    }
    try {
      fs.writeFileSync(filePath, out, "utf8");
      console.log("[migrate] Rewrote:", path.relative(ROOT, filePath));
      migrated++;
    } catch (err) {
      console.warn("[migrate] Skip (write):", filePath, err.message);
    }
  }
  console.log("[migrate] Done. Files " + (DRY_RUN ? "that would be rewritten" : "rewritten") + ":", migrated);
}

main();
