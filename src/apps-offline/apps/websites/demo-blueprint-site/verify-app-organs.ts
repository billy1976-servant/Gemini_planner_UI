/**
 * Verification: demo app.json expands organs and resolves slots.
 * Run: npx ts-node -r tsconfig-paths/register src/apps-offline/apps/websites/demo-blueprint-site/verify-app-organs.ts
 */

import appJson from "./app.json";
import { expandOrgansInDocument } from "@/organs/resolve-organs";
import { loadOrganVariant } from "@/organs/organ-registry";
import { applySkinBindings } from "@/logic/bridges/skinBindings.apply";

function collectTypes(node: unknown, types: Set<string>, roles: Set<string>): void {
  if (!node || typeof node !== "object") return;
  const n = node as { type?: string; role?: string; children?: unknown[] };
  if (typeof n.type === "string") types.add(n.type.toLowerCase());
  if (typeof n.role === "string") roles.add(n.role);
  if (Array.isArray(n.children)) n.children.forEach((c) => collectTypes(c, types, roles));
}

const doc = { meta: { domain: "offline", pageId: "demo", version: 1 }, nodes: (appJson as any).children };
const data = (appJson as any).data ?? {};
const expanded = expandOrgansInDocument(doc as any, loadOrganVariant);
const bound = applySkinBindings(expanded as any, data);
const nodes = (bound as any).nodes ?? [];

const types = new Set<string>();
const roles = new Set<string>();
nodes.forEach((n: unknown) => collectTypes(n, types, roles));

const hasOrgan = types.has("organ");
const expectedRoles = ["header", "hero", "features", "testimonials", "pricing", "faq", "cta", "footer"];
const missingRoles = expectedRoles.filter((r) => !roles.has(r));

if (hasOrgan) {
  console.error("FAIL: Tree still contains type 'organ' after expansion.");
  process.exit(1);
}
if (missingRoles.length > 0) {
  console.error("FAIL: Missing expected roles:", missingRoles);
  process.exit(1);
}

console.log("OK: No 'organ' type in final tree.");
console.log("OK: Roles present:", [...roles].sort().join(", "));
console.log("OK: Node types:", [...types].sort().join(", "));
console.log("Verified", nodes.length, "top-level nodes.");
process.exit(0);
