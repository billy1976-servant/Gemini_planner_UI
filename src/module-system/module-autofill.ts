/**
 * Content.txt generator from tree + templates.
 * Generates content.txt with placeholders {{businessName}}, {{industry}}, {{location}}
 * or skeleton-only for manual mode.
 */

import type { TreeNode } from "./tree-types";

const INDENT_STEP = 2;

function* walk(
  nodes: TreeNode[],
  parentRawId: string
): Generator<{ node: TreeNode; rawId: string }> {
  const prefix = parentRawId || "1";
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const rawId = parentRawId ? `${parentRawId}.${i + 1}` : `${prefix}.${i}`;
    yield { node, rawId };
    if (node.children?.length) {
      yield* walk(node.children, rawId);
    }
  }
}

function escape(s: string): string {
  if (/^".*"$/.test(s)) return s;
  return `"${s.replace(/"/g, '\\"')}"`;
}

function applyPlaceholders(
  text: string,
  placeholders: Record<string, string>
): string {
  let out = text;
  for (const [key, value] of Object.entries(placeholders)) {
    out = out.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }
  return out;
}

/** Default template snippets per type/slot. */
function defaultContentFor(
  node: TreeNode,
  rawId: string,
  placeholders: Record<string, string>
): Record<string, string> {
  const name = node.name;
  const type = (node.type || "").toLowerCase();
  const slots = node.slots ?? [];

  const content: Record<string, string> = {};

  if (slots.includes("title")) {
    if (type === "section") {
      content.title = `{{businessName}} - ${name.replace(/([A-Z])/g, " $1").trim()}`;
    } else {
      content.title = `{{businessName}}`;
    }
  }
  if (slots.includes("label")) {
    content.label = name.replace(/([A-Z])/g, " $1").trim();
    if (type === "field") content.input = "";
  }
  if (slots.includes("body")) {
    content.body = `Content for ${name}. Customize as needed.`;
  }
  if (slots.includes("steps")) {
    content.steps = "Step 1 → Step 2 → Step 3";
  }
  if (slots.includes("left")) content.left = "{{businessName}}";
  if (slots.includes("right")) content.right = "© {{businessName}}";

  for (const k of Object.keys(content)) {
    content[k] = applyPlaceholders(content[k], placeholders);
  }
  return content;
}

/**
 * Generate content.txt body from tree. Uses same rawId scheme as module-tree.
 * Mode: "auto" = fill with templates + placeholders; "manual" = skeleton (rawId headers only, empty content).
 */
export function treeToContent(
  sectionTree: TreeNode[],
  placeholders: Record<string, string>,
  mode: "auto" | "manual"
): string {
  const lines: string[] = [];

  for (const { node, rawId } of walk(sectionTree, "")) {
    const type = node.type || "Node";
    lines.push(`${rawId} ${node.name} (${type})`);

    if (mode === "manual") {
      const slots = node.slots ?? [];
      for (const slot of slots) {
        lines.push(`- ${slot}: ""`);
      }
    } else {
      const content = defaultContentFor(node, rawId, placeholders);
      for (const [key, value] of Object.entries(content)) {
        lines.push(`- ${key}: ${escape(value)}`);
      }
    }
    lines.push("");
  }

  return lines.join("\n").trimEnd();
}
