"use client";

/**
 * Exhaustive lifecycle trace: RENDER → DOM → PANEL_SELECTION → STATE_WRITE → STATE_MERGE → STATE_READ → CLICK_CAPTURE → NAV_EXECUTION.
 * Every stage logs { stage, screenKey, elementId, data-node-id, navTargetsMap, resolvedNavTarget }.
 * On divergence (expected from SAVE !== actual at CLICK), prints EXACT FAILING LINE and MINIMAL FIX PATCH.
 */

import { getState } from "@/state/state-store";

const ENABLED =
  typeof process !== "undefined" &&
  process.env.NODE_ENV === "development" &&
  (typeof (globalThis as any).window === "undefined" || (globalThis as any).window.__NAV_INSTRUMENT__ !== false);

type NavTarget = { toScreenId?: string; toAnchor?: string };

export type LifecycleStage =
  | "RENDER"
  | "DOM_SCAN"
  | "PANEL_SELECTION"
  | "STATE_WRITE"
  | "STATE_MERGE"
  | "STATE_READ"
  | "CLICK_CAPTURE"
  | "NAV_EXECUTION";

export type LifecyclePayload = {
  stage: LifecycleStage;
  screenKey?: string;
  elementId?: string;
  dataNodeId?: string;
  navTargetsMap?: Record<string, NavTarget>;
  resolvedNavTarget?: NavTarget;
  [key: string]: unknown;
};

function logLifecycle(payload: LifecyclePayload): void {
  if (!ENABLED || typeof console === "undefined" || !console.log) return;
  console.log("[NavTrace]", payload);
}

/** Last save payload for mismatch detection */
export type LastSavePayload = { screenKey: string; elementId: string; navTarget: NavTarget };

export function logPanelSelection(payload: {
  screenKey: string;
  elementId: string;
  navTargetsMap: Record<string, NavTarget> | undefined;
  resolvedNavTarget: NavTarget | undefined;
}): void {
  if (!ENABLED || typeof console === "undefined" || !console.log) return;
  logLifecycle({
    stage: "PANEL_SELECTION",
    screenKey: payload.screenKey,
    elementId: payload.elementId,
    dataNodeId: payload.elementId,
    navTargetsMap: payload.navTargetsMap,
    resolvedNavTarget: payload.resolvedNavTarget,
  });
}

export function logNavRender(payload: {
  screenKey: string;
  elementId?: string;
  navTargetsMap: Record<string, NavTarget> | undefined;
  resolvedNavTarget?: NavTarget;
  source: "panel" | "tsx-capture";
}): void {
  if (!ENABLED || typeof console === "undefined" || !console.log) return;
  logLifecycle({
    stage: "RENDER",
    screenKey: payload.screenKey,
    elementId: payload.elementId,
    dataNodeId: payload.elementId,
    navTargetsMap: payload.navTargetsMap,
    resolvedNavTarget: payload.resolvedNavTarget,
    source: payload.source,
  });
}

export function logNavSave(payload: {
  screenKey: string;
  elementId: string;
  navTargetsMap: Record<string, NavTarget> | undefined;
  resolvedNavTarget: NavTarget;
}): void {
  if (!ENABLED || typeof console === "undefined" || !console.log) return;
  const w = typeof (globalThis as any).window !== "undefined" ? (globalThis as any).window : undefined;
  if (w) {
    (w as any).__NAV_LAST_SAVE_SCREEN_KEY__ = payload.screenKey;
    (w as any).__NAV_LAST_SAVE__ = {
      screenKey: payload.screenKey,
      elementId: payload.elementId,
      navTarget: payload.resolvedNavTarget,
    } as LastSavePayload;
  }
  logLifecycle({
    stage: "STATE_WRITE",
    screenKey: payload.screenKey,
    elementId: payload.elementId,
    dataNodeId: payload.elementId,
    navTargetsMap: payload.navTargetsMap,
    resolvedNavTarget: payload.resolvedNavTarget,
  });
}

/** Called from state-resolver via window.__NAV_LOG_STATE_MERGE__ (no import in resolver) */
export function registerStateMergeLogger(): void {
  if (typeof (globalThis as any).window === "undefined") return;
  (globalThis as any).window.__NAV_LOG_STATE_MERGE__ = (data: {
    screenKey: string;
    existingKeysBefore: string[];
    incomingKeys: string[];
    mergedNavTargets: Record<string, NavTarget>;
  }) => {
    if (!ENABLED || typeof console === "undefined" || !console.log) return;
    logLifecycle({
      stage: "STATE_MERGE",
      screenKey: data.screenKey,
      navTargetsMap: data.mergedNavTargets,
      existingKeysBefore: data.existingKeysBefore,
      incomingKeys: data.incomingKeys,
      mergedKeysAfter: Object.keys(data.mergedNavTargets),
    });
  };
}
registerStateMergeLogger();

function reportExactFailingLine(expected: NavTarget, got: NavTarget | undefined, context: { screenKey: string; elementId: string }): void {
  const line = "src/app/dev/page.tsx";
  const lineNum = 208;
  const code = "const nav = navTargetsMapAtClick?.[id];";
  console.error(
    "[NavTrace] DIVERGENCE — expected (from SAVE) !== actual (at CLICK). Stop.",
    "\n  Expected:",
    expected,
    "\n  Got:",
    got,
    "\n  Context:",
    context
  );
  console.error(
    "[NavTrace] EXACT FAILING LINE:",
    `\n  FILE: ${line}\n  LINE: ${lineNum}\n  CODE: ${code}`
  );
  console.error(
    "[NavTrace] ROOT CAUSE: The value used at click is read from state at the line above. Wrong value => (1) state merge overwrote or wrong payload. Wrong elementId => (2) DOM duplicate data-node-id or wrong closest() target."
  );
  console.error(
    "[NavTrace] MINIMAL FIX PATCH (if state has wrong value):",
    "\n  --- src/03_Runtime/state/state-resolver.ts",
    "\n  Ensure merge never replaces entire map:",
    "\n  cast.navTargets = { ...existing, ...incomingNavTargets };",
    "\n  --- src/07_Dev_Tools/nav/DevNavigationPanel.tsx",
    "\n  Ensure single entry per save:",
    "\n  const singleEntry = { [selectedElementId]: nav };",
    "\n  dispatchState(\"layout.setNavTargets\", { screenKey, navTargets: singleEntry });"
  );
  console.error(
    "[NavTrace] MINIMAL FIX PATCH (if wrong elementId / duplicate):",
    "\n  --- TSX screen (e.g. landing-2.tsx)",
    "\n  Ensure every interactive element has a unique data-node-id attribute.",
    "\n  No two elements must share the same data-node-id."
  );
}

export function logNavClick(payload: {
  screenKey: string;
  elementId: string;
  navTargetsMap: Record<string, NavTarget> | undefined;
  resolvedNavTarget: NavTarget | undefined;
  eventPath?: { targetTag: string; targetId: string; closestNodeId: string };
  navTargetsMapEntryUsed?: NavTarget | undefined;
}): void {
  if (!ENABLED || typeof console === "undefined" || !console.log) return;
  const w = typeof (globalThis as any).window !== "undefined" ? (globalThis as any).window : undefined;
  const lastSaveKey = w ? (w as any).__NAV_LAST_SAVE_SCREEN_KEY__ : undefined;
  const lastSave = w ? (w as any).__NAV_LAST_SAVE__ as LastSavePayload | undefined : undefined;

  logLifecycle({
    stage: "STATE_READ",
    screenKey: payload.screenKey,
    elementId: payload.elementId,
    dataNodeId: payload.eventPath?.closestNodeId ?? payload.elementId,
    navTargetsMap: payload.navTargetsMap,
    resolvedNavTarget: payload.resolvedNavTarget ?? payload.navTargetsMapEntryUsed,
    navTargetsMapEntryUsed: payload.navTargetsMapEntryUsed ?? payload.resolvedNavTarget,
  });

  if (lastSaveKey !== undefined && lastSaveKey !== payload.screenKey) {
    console.warn("[NavTrace] SCREENKEY MISMATCH: panel save used", lastSaveKey, "click used", payload.screenKey);
  }

  logLifecycle({
    stage: "CLICK_CAPTURE",
    screenKey: payload.screenKey,
    elementId: payload.elementId,
    dataNodeId: payload.eventPath?.closestNodeId ?? payload.elementId,
    navTargetsMap: payload.navTargetsMap,
    resolvedNavTarget: payload.resolvedNavTarget,
    eventPath: payload.eventPath,
    navTargetsMapEntryUsed: payload.navTargetsMapEntryUsed ?? payload.resolvedNavTarget,
  });

  if (lastSave && payload.screenKey === lastSave.screenKey && payload.elementId === lastSave.elementId) {
    const expected = lastSave.navTarget;
    const got = payload.resolvedNavTarget;
    const match = !!got && expected.toScreenId === got.toScreenId && expected.toAnchor === got.toAnchor;
    if (!match) {
      reportExactFailingLine(expected, got ?? undefined, {
        screenKey: payload.screenKey,
        elementId: payload.elementId,
      });
    }
  }
}

export function logNavExecution(screenKey: string, elementId: string, resolvedNavTarget: NavTarget): void {
  if (!ENABLED || typeof console === "undefined" || !console.log) return;
  logLifecycle({
    stage: "NAV_EXECUTION",
    screenKey,
    elementId,
    dataNodeId: elementId,
    resolvedNavTarget,
  });
}

/** After each save, print full state table for layoutByScreen[screenKey].navTargets */
export function logNavStateTableAfterSave(screenKey: string): void {
  if (!ENABLED || typeof console === "undefined" || !console.log) return;
  const state = getState();
  const navTargets = state?.layoutByScreen?.[screenKey]?.navTargets ?? {};
  const entries = Object.entries(navTargets);
  console.log("[NavInstrument] STATE TABLE after save", { screenKey, entries });
  if (entries.length > 0) {
    console.table(entries.map(([elementId, nav]) => ({ elementId, toScreenId: nav?.toScreenId, toAnchor: nav?.toAnchor })));
  }
}

/** Scan DOM for all [data-node-id], list them and flag duplicates */
export function scanDomForNodeIds(): { elementId: string; duplicates: string[]; all: Array<{ id: string; tagName: string }> } {
  if (typeof document === "undefined") {
    return { elementId: "", duplicates: [], all: [] };
  }
  const elements = Array.from(document.querySelectorAll("[data-node-id]"));
  const all = elements.map((el) => ({
    id: el.getAttribute("data-node-id") ?? "",
    tagName: el.tagName,
  }));
  const idCounts = new Map<string, number>();
  for (const { id } of all) {
    if (id) idCounts.set(id, (idCounts.get(id) ?? 0) + 1);
  }
  const duplicates = Array.from(idCounts.entries())
    .filter(([, count]) => count > 1)
    .map(([id]) => id);
  return { elementId: "scan", duplicates, all: all.filter((x) => x.id) };
}

let previousDomNodeIds: Set<string> = new Set();

export function logDomNodeIdScan(): void {
  if (!ENABLED || typeof console === "undefined" || !console.log) return;
  const result = scanDomForNodeIds();
  const currentIds = new Set(result.all.map((x) => x.id).filter(Boolean));
  const added = [...currentIds].filter((id) => !previousDomNodeIds.has(id));
  const removed = [...previousDomNodeIds].filter((id) => !currentIds.has(id));
  const hasMutation = added.length > 0 || removed.length > 0;
  previousDomNodeIds = currentIds;
  logLifecycle({
    stage: "DOM_SCAN",
    navTargetsMap: undefined,
    dataNodeId: undefined,
    domList: result.all,
    duplicateIds: result.duplicates,
    mutation: hasMutation ? { added, removed } : undefined,
    total: result.all.length,
  });
  if (result.duplicates.length > 0) {
    console.warn("[NavTrace] DUPLICATE data-node-id in DOM:", result.duplicates);
  }
  if (hasMutation) {
    console.log("[NavTrace] DOM mutation (ids added/removed):", { added, removed });
  }
}

let mutationObserverInstalled = false;

/** Watch DOM for any change to [data-node-id]: log when IDs are added, removed, or duplicated */
export function installMutationObserverForNodeIds(observeRoot?: Element | null): void {
  if (!ENABLED || typeof document === "undefined" || mutationObserverInstalled) return;
  const root = observeRoot ?? document.body;
  if (!root) return;
  mutationObserverInstalled = true;
  let previousIds: Set<string> = new Set();
  const scan = () => {
    const result = scanDomForNodeIds();
    const currentIds = new Set(result.all.map((x) => x.id).filter(Boolean));
    const added = [...currentIds].filter((id) => !previousIds.has(id));
    const removed = [...previousIds].filter((id) => !currentIds.has(id));
    if (added.length || removed.length || result.duplicates.length) {
      console.log("[NavInstrument] MutationObserver [data-node-id] change", {
        added,
        removed,
        duplicateIds: result.duplicates,
        allIds: result.all.map((x) => x.id),
      });
      if (result.duplicates.length > 0) {
        console.warn("[NavInstrument] DUPLICATE data-node-id after mutation:", result.duplicates);
      }
    }
    previousIds = currentIds;
  };
  const observer = new MutationObserver(() => {
    scan();
  });
  observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-node-id"] });
  scan();
}

/** Log React render cycle for a container: print every element's data-node-id; flag duplicates/mutations */
export function logContainerNodeIdsAfterRender(containerRef: { current: HTMLElement | null }, componentName: string): void {
  if (!ENABLED || typeof console === "undefined" || !console.log) return;
  const el = containerRef?.current;
  if (!el) return;
  const elements = Array.from(el.querySelectorAll("[data-node-id]"));
  const all = elements.map((e) => ({ id: e.getAttribute("data-node-id") ?? "", tagName: e.tagName }));
  const idCounts = new Map<string, number>();
  for (const { id } of all) {
    if (id) idCounts.set(id, (idCounts.get(id) ?? 0) + 1);
  }
  const duplicateIds = Array.from(idCounts.entries())
    .filter(([, c]) => c > 1)
    .map(([id]) => id);
  logLifecycle({
    stage: "DOM_SCAN",
    source: componentName,
    dataNodeIds: all.filter((x) => x.id),
    duplicateIds: duplicateIds.length ? duplicateIds : undefined,
    total: all.length,
  });
  if (duplicateIds.length > 0) {
    console.warn("[NavTrace] DUPLICATE data-node-id in", componentName, duplicateIds);
  }
}
