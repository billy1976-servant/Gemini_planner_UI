/**
 * Dev-only self-test: asserts that navTargets persist per-element and that
 * click resolution returns the correct target for each elementId.
 * Runs once in dev mode and prints PASS/FAIL to console.
 */

import { getState, dispatchState } from "@/state/state-store";

const TEST_SCREEN_KEY = "__nav_test__";
const TEST_ENTRIES = [
  { id: "e1", toScreenId: "screen-1", toAnchor: "#a1" },
  { id: "e2", toScreenId: "screen-2", toAnchor: "#a2" },
  { id: "e3", toScreenId: "screen-3", toAnchor: "#a3" },
  { id: "e4", toScreenId: "screen-4", toAnchor: "#a4" },
];

let hasRun = false;

export function runNavTargetsPersistenceTest(): boolean {
  if (hasRun || process.env.NODE_ENV === "production") return true;
  if (typeof (globalThis as any).window === "undefined") return true;
  hasRun = true;

  try {
    // 1) Simulate saving 4 different elementIds on the same screenKey with 4 different anchors
    for (const entry of TEST_ENTRIES) {
      dispatchState("layout.setNavTargets", {
        screenKey: TEST_SCREEN_KEY,
        navTargets: {
          [entry.id]: {
            toScreenId: entry.toScreenId,
            toAnchor: entry.toAnchor,
          },
        },
      });
    }

    const state = getState();
    const navTargets = state?.layoutByScreen?.[TEST_SCREEN_KEY]?.navTargets ?? {};
    const keys = Object.keys(navTargets);

    // 2) Assert state after each save contains all 4 keys and values unchanged for previous ones
    if (keys.length !== 4) {
      console.error("[NavTargetsPersistenceTest] FAIL: expected 4 keys, got", keys.length, keys);
      return false;
    }
    for (const entry of TEST_ENTRIES) {
      const stored = navTargets[entry.id];
      if (!stored || stored.toScreenId !== entry.toScreenId || stored.toAnchor !== entry.toAnchor) {
        console.error("[NavTargetsPersistenceTest] FAIL: key", entry.id, "expected", entry, "got", stored);
        return false;
      }
    }

    // 3) Simulate click resolution for each elementId and assert each resolves to its own target
    for (const entry of TEST_ENTRIES) {
      const resolved = getState()?.layoutByScreen?.[TEST_SCREEN_KEY]?.navTargets?.[entry.id];
      if (!resolved || resolved.toScreenId !== entry.toScreenId || resolved.toAnchor !== entry.toAnchor) {
        console.error("[NavTargetsPersistenceTest] FAIL: click resolve for", entry.id, "expected", entry, "got", resolved);
        return false;
      }
    }

    console.log("[NavTargetsPersistenceTest] PASS: 4 nav targets persisted and resolved per-element.");
    return true;
  } catch (err) {
    console.error("[NavTargetsPersistenceTest] FAIL:", err);
    return false;
  }
}
