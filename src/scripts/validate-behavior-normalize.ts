#!/usr/bin/env ts-node
/**
 * Packet 10 validation: legacy and canonical behavior payloads resolve to the same canonical intent.
 * Run: npx ts-node -r tsconfig-paths/register src/scripts/validate-behavior-normalize.ts
 *   or: npm run behavior:validate (if script added)
 */
import {
  normalizeBehaviorPayload,
  normalizeNavigateDetail,
} from "../contracts/behavior-normalize";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

// Legacy Action state:update → Mutation intent
const legacyStateUpdate = {
  type: "Action",
  params: { name: "state:update", key: "x", value: 1 },
};
const canonicalMutation = {
  kind: "mutation",
  verb: "update",
  target: "x",
  value: 1,
};

const r1 = normalizeBehaviorPayload(legacyStateUpdate);
const r2 = normalizeBehaviorPayload(canonicalMutation);

assert(r1.intent.kind === "mutation", "Legacy state:update → mutation intent");
assert(r2.intent.kind === "mutation", "Canonical mutation stays mutation");
assert(
  (r1.intent as any).verb === "update" && (r2.intent as any).verb === "update",
  "Both resolve to verb update"
);
assert(r1.legacy === true && r2.legacy === false, "Legacy vs canonical flag");

// Legacy Navigation → Navigation intent
const legacyNav = { type: "Navigation", params: { verb: "go", to: "screen-a" } };
const r3 = normalizeBehaviorPayload(legacyNav);
assert(r3.intent.kind === "navigation", "Legacy Navigation → navigation intent");
assert((r3.intent as any).verb === "go", "Navigation verb go");

// navigate detail: legacy { to } → same as contract-ish { verb, variant }
const detailLegacy = { to: "screen-b" };
const detailContract = { verb: "go", variant: "screen", to: "screen-b" };
const r4 = normalizeNavigateDetail(detailLegacy);
const r5 = normalizeNavigateDetail(detailContract);
assert(r4.intent.kind === "navigation" && r5.intent.kind === "navigation", "Both navigate details → navigation");
assert((r4.intent as any).verb === "go" && (r5.intent as any).verb === "go", "Both → go");

console.log("[validate-behavior-normalize] All checks passed: legacy and canonical resolve to same canonical intent.");
process.exit(0);
