/**
 * Runtime test: run deriveState with 4x layout.setNavTargets (same screenKey, 4 elementIds)
 * and assert merged state has all 4 keys with correct values. No browser required.
 */
import type { StateEvent } from "../src/03_Runtime/state/state";
// @ts-ignore - deriveState is the only export we need
import { deriveState } from "../src/03_Runtime/state/state-resolver";

const SCREEN_KEY = "tsx--live--Business-Container_Creations-landing-2";
const ENTRIES = [
  { id: "explore-container", toScreenId: "__same__", toAnchor: "#intro" },
  { id: "structural-fit", toScreenId: "__same__", toAnchor: "#structural-fit" },
  { id: "ventilation", toScreenId: "__same__", toAnchor: "#ventilation" },
  { id: "continue", toScreenId: "__same__", toAnchor: "#continue" },
];

function run(): boolean {
  const log: StateEvent[] = [
    { intent: "state:currentView", payload: { value: "|home" } },
  ];
  for (const e of ENTRIES) {
    log.push({
      intent: "layout.setNavTargets",
      payload: {
        screenKey: SCREEN_KEY,
        navTargets: { [e.id]: { toScreenId: e.toScreenId, toAnchor: e.toAnchor } },
      },
    });
  }
  const state = deriveState(log);
  const navTargets = (state as any)?.layoutByScreen?.[SCREEN_KEY]?.navTargets ?? {};
  const keys = Object.keys(navTargets);
  if (keys.length !== 4) {
    console.error("[nav-merge-runtime-test] FAIL: expected 4 keys, got", keys.length, JSON.stringify(navTargets, null, 2));
    return false;
  }
  for (const e of ENTRIES) {
    const stored = navTargets[e.id];
    if (!stored || stored.toScreenId !== e.toScreenId || stored.toAnchor !== e.toAnchor) {
      console.error("[nav-merge-runtime-test] FAIL: key", e.id, "expected", e, "got", stored);
      return false;
    }
  }
  console.log("[nav-merge-runtime-test] PASS: merge preserves all 4 entries.");
  return true;
}

const ok = run();
if (!ok) process.exit(1);
