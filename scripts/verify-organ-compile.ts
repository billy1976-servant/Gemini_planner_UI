#!/usr/bin/env ts-node
/**
 * Verify organ compile: run blueprint compiler on organ-test fixture and assert
 * app.json contains a structural organ node only (no layout/styling).
 * Exit 0 = PASS, 1 = FAIL.
 */
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

const ROOT = process.cwd();
const FIXTURE_DIR = path.resolve(ROOT, "src/07_Dev_Tools/scripts/fixtures/organ-test");
const BLUEPRINT_SCRIPT = path.resolve(ROOT, "src/07_Dev_Tools/scripts/blueprint.ts");
const APP_JSON_PATH = path.join(FIXTURE_DIR, "app.json");

const FORBIDDEN_KEYS = ["layout", "style", "palette", "params", "role"];
const ALLOWED_ORGAN_KEYS = ["id", "type", "organId", "variant", "content", "children"];

function findOrganNode(node: unknown): unknown | null {
  if (!node || typeof node !== "object") return null;
  const n = node as Record<string, unknown>;
  if (n.type === "organ") return node;
  const children = n.children as unknown[] | undefined;
  if (Array.isArray(children)) {
    for (const c of children) {
      const found = findOrganNode(c);
      if (found) return found;
    }
  }
  return null;
}

function main(): void {
  console.log("[verify-organ-compile] Running blueprint compiler on fixture...");
  if (!fs.existsSync(FIXTURE_DIR)) {
    console.error("FAIL: Fixture directory not found:", FIXTURE_DIR);
    process.exit(1);
  }
  if (!fs.existsSync(path.join(FIXTURE_DIR, "blueprint.txt"))) {
    console.error("FAIL: blueprint.txt not found in fixture");
    process.exit(1);
  }

  try {
    execSync(`npx ts-node "${BLUEPRINT_SCRIPT}" "${FIXTURE_DIR}"`, {
      cwd: ROOT,
      stdio: "pipe",
      encoding: "utf8",
    });
  } catch (e: unknown) {
    const err = e as { stdout?: string; stderr?: string };
    console.error("FAIL: Compiler failed:", err.stdout ?? "", err.stderr ?? "");
    process.exit(1);
  }

  if (!fs.existsSync(APP_JSON_PATH)) {
    console.error("FAIL: app.json was not produced");
    process.exit(1);
  }

  let app: unknown;
  try {
    const raw = fs.readFileSync(APP_JSON_PATH, "utf8");
    app = JSON.parse(raw);
  } catch (e) {
    console.error("FAIL: app.json parse error:", e);
    process.exit(1);
  }

  const screen = (app as Record<string, unknown>).children as unknown[] | undefined;
  if (!Array.isArray(screen)) {
    console.error("FAIL: app.json has no screen.children array");
    process.exit(1);
  }

  const organNode = findOrganNode({ children: screen });
  if (!organNode) {
    console.error("FAIL: No node with type === 'organ' found in app.json");
    process.exit(1);
  }

  const o = organNode as Record<string, unknown>;
  if (o.type !== "organ") {
    console.error("FAIL: Expected type 'organ', got", o.type);
    process.exit(1);
  }
  if (o.organId !== "hero") {
    console.error("FAIL: Expected organId 'hero', got", o.organId);
    process.exit(1);
  }
  if (o.variant !== "centered") {
    console.error("FAIL: Expected variant 'centered', got", o.variant);
    process.exit(1);
  }
  const content = o.content as Record<string, unknown> | undefined;
  if (!content || typeof content !== "object") {
    console.error("FAIL: Organ node missing content object");
    process.exit(1);
  }
  const slotKeys = ["hero.title", "hero.subtitle", "hero.cta"];
  for (const k of slotKeys) {
    if (!(k in content)) {
      console.error("FAIL: content missing slot key:", k);
      process.exit(1);
    }
  }
  if (!Array.isArray(o.children)) {
    console.error("FAIL: Organ node children is not an array");
    process.exit(1);
  }
  if (o.children.length !== 0) {
    console.error("FAIL: Organ node must have children: []");
    process.exit(1);
  }

  for (const key of Object.keys(o)) {
    if (!ALLOWED_ORGAN_KEYS.includes(key)) {
      console.error("FAIL: Organ node has disallowed key:", key);
      process.exit(1);
    }
  }
  for (const key of FORBIDDEN_KEYS) {
    if (key in o) {
      console.error("FAIL: Organ node must NOT have key:", key);
      process.exit(1);
    }
  }

  console.log("[verify-organ-compile] PASS: Organ node shape correct, no layout/styling exported.");
  process.exit(0);
}

main();
