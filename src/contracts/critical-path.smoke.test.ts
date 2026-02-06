/**
 * Critical-path smoke tests (Phase 9.6)
 *
 * Ensures loadScreen, JsonRenderer (applyProfileToNode), behavior-listener, and deriveState
 * remain importable and retain minimal contract. Update when refactor changes behavior.
 *
 * Run: npx ts-node -r tsconfig-paths/register src/contracts/critical-path.smoke.test.ts
 * Or: npm run test (if configured to include this file)
 */

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Critical-path smoke failed: ${message}`);
}

// --- deriveState (state-resolver)
import { deriveState, type DerivedState } from "@/state/state-resolver";
const empty = deriveState([]);
assert(typeof empty === "object", "deriveState([]) returns object");
assert(Array.isArray(empty.journal) === false && typeof empty.journal === "object", "deriveState journal is object");
assert(empty.rawCount === 0, "deriveState([]).rawCount === 0");
assert(empty.values != null && typeof empty.values === "object", "deriveState has values");

// --- loadScreen (screen-loader)
import { loadScreen } from "@/engine/core/screen-loader";
assert(typeof loadScreen === "function", "loadScreen is function");

// --- behavior-listener
import * as behaviorListener from "@/engine/core/behavior-listener";
assert(typeof (behaviorListener as any).installBehaviorListener === "function", "installBehaviorListener exists");

// JsonRenderer (and internal applyProfileToNode) lives in json-renderer.tsx; not imported here to avoid
// pulling TSX/React in ts-node. Covered by app render path and by updating this checklist when refactoring.

console.log("Critical-path smoke: all checks passed.");
export {};
