"use client";

/**
 * Dev-only panel to assign Screen-ID navigation targets to buttons and cards.
 * Renders in the right sidebar when devMode === "dev". Scans the current screen
 * tree for button/card elements and lets the user pick a target screen + anchor.
 * When screenTree is null (TSX screens), falls back to scanning the DOM for
 * elements with [data-node-id].
 */

import React, { useMemo, useState, useEffect, useLayoutEffect } from "react";
import { useSyncExternalStore } from "react";
import { getState, dispatchState, subscribeState } from "@/state/state-store";
import LinkTargetPicker from "./LinkTargetPicker";
import { setNavDebug, getNavDebug, subscribeNavDebug } from "./nav-debug-store";
import { logNavSave, logNavStateTableAfterSave, logDomNodeIdScan, logNavRender, logPanelSelection } from "./nav-instrumentation";

const DEBUG_NAV = typeof (globalThis as any).window !== "undefined" && (globalThis as any).window.__DEBUG_NAV__ === true;

/** Same-page anchor target; used by TsxNavCapture to scroll instead of navigate. */
export const SAME_PAGE_SCREEN_ID = "__same__";

/** Step options for ContainerCreationsLanding-style flow mode (label → anchor). */
const CONTAINER_CREATIONS_FLOW_STEPS: Array<{ label: string; anchor: string }> = [
  { label: "Intro", anchor: "#intro" },
  { label: "Step 1 – Explore Container Upgrade", anchor: "#explore-container" },
  { label: "Step 2 – Check Structural Fit", anchor: "#structural-fit" },
  { label: "Step 3 – Ventilate Your Container", anchor: "#ventilation" },
  { label: "Step 4 – Why We Lead", anchor: "#why-we-lead" },
  { label: "Step 5 – Continue", anchor: "#continue" },
];

export type DevNavigationPanelProps = {
  /** Current screen tree (composed root node with children). */
  screenTree: unknown;
  /** Screen key for state lookup; use same normalization as renderer: currentScreen.replace(/[^a-zA-Z0-9]/g, "-") */
  screenKey: string;
};

type NavigableItem = { id: string; label: string; type: string };

function collectNavigableElements(node: unknown, acc: NavigableItem[] = [], indexRef: { n: number } = { n: 0 }): NavigableItem[] {
  if (!node || typeof node !== "object") return acc;
  const n = node as Record<string, unknown>;
  const type = (n.type as string)?.toLowerCase?.() ?? "";
  if (type === "button" || type === "card") {
    const id = (n.id as string) ?? (n.role as string) ?? `anonymous-${indexRef.n}`;
    indexRef.n += 1;
    const label = (n.id as string) ?? (n.role as string) ?? `Unnamed ${type}`;
    acc.push({ id, label, type });
  }
  const children = n.children as unknown[] | undefined;
  if (Array.isArray(children)) {
    for (const child of children) {
      collectNavigableElements(child, acc, indexRef);
    }
  }
  const items = n.items as unknown[] | undefined;
  if (Array.isArray(items)) {
    for (let i = 0; i < items.length; i++) {
      const item = items[i] as Record<string, unknown>;
      const itemId = (item.id as string) ?? (item.role as string) ?? `item-${i}`;
      const itemLabel = (item.id as string) ?? (item.role as string) ?? `Item ${i + 1}`;
      acc.push({ id: itemId, label: itemLabel, type: "card" });
    }
  }
  return acc;
}

function scanDomForNavigableElements(): NavigableItem[] {
  if (typeof document === "undefined") return [];
  const elements = Array.from(document.querySelectorAll("[data-node-id]"));
  return elements
    .map((el) => {
      const id = el.getAttribute("data-node-id");
      if (!id || !id.trim()) return null;
      const label =
        (el as HTMLElement).innerText?.slice(0, 40)?.trim() || id;
      return { id: id.trim(), label: label || id, type: "element" };
    })
    .filter((item): item is NavigableItem => item != null);
}

function isFlowMode(screenKey: string): boolean {
  return screenKey.toLowerCase().includes("containercreationslanding");
}

export default function DevNavigationPanel({ screenTree, screenKey }: DevNavigationPanelProps) {
  const [selectedElementId, setSelectedElementId] = useState<string | "">("");
  const [domNavigableElements, setDomNavigableElements] = useState<NavigableItem[]>([]);
  const [advancedMode, setAdvancedMode] = useState(false);

  const flowMode = isFlowMode(screenKey);
  const hasTree = screenTree != null && typeof screenTree === "object";

  // Subscribe to state so we re-render after each save and show correct targets in the UI
  const stateSnapshot = useSyncExternalStore(subscribeState, getState, getState);
  const navTargetsMap = stateSnapshot?.layoutByScreen?.[screenKey]?.navTargets;
  useLayoutEffect(() => {
    logNavRender({ screenKey, navTargetsMap, source: "panel" });
  }, [screenKey, navTargetsMap]);

  useEffect(() => {
    if (hasTree) return;
    const run = () => setDomNavigableElements(scanDomForNavigableElements());
    const t = setTimeout(run, 300);
    const interval = setInterval(run, 2000);
    return () => {
      clearTimeout(t);
      clearInterval(interval);
    };
  }, [hasTree]);

  const navigableElements = useMemo(() => {
    const root = screenTree as Record<string, unknown> | null;
    if (root) {
      const acc: NavigableItem[] = [];
      const indexRef = { n: 0 };
      collectNavigableElements(root, acc, indexRef);
      return acc;
    }
    return domNavigableElements;
  }, [screenTree, domNavigableElements]);

  // #region agent log
  useEffect(() => {
    const ids = navigableElements.map((e) => e.id);
    const dupe = ids.length !== new Set(ids).size;
    if (navigableElements.length > 0) fetch('http://127.0.0.1:7242/ingest/7e15e045-3112-419f-8116-3226c0884ac1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'ea7e9f'},body:JSON.stringify({sessionId:'ea7e9f',hypothesisId:'H4',location:'DevNavigationPanel.tsx:navigableElements',message:'dropdown element ids',data:{ids,hasDuplicateIds:dupe,count:ids.length},timestamp:Date.now()})}).catch(()=>{});
  }, [navigableElements]);
  // #endregion

  // Instrumentation: scan DOM for [data-node-id] and flag duplicates (TSX screens)
  useEffect(() => {
    if (!hasTree && navigableElements.length > 0) {
      logDomNodeIdScan();
    }
  }, [hasTree, navigableElements.length]);

  const currentNavTarget =
    selectedElementId
      ? getState()?.layoutByScreen?.[screenKey]?.navTargets?.[selectedElementId] ?? {}
      : {};

  // #region agent log
  useEffect(() => {
    if (!selectedElementId) return;
    const state = getState()?.layoutByScreen?.[screenKey]?.navTargets ?? {};
    const current = state[selectedElementId] ?? {};
    logPanelSelection({
      screenKey,
      elementId: selectedElementId,
      navTargetsMap: state,
      resolvedNavTarget: Object.keys(current).length ? current : undefined,
    });
    fetch('http://127.0.0.1:7242/ingest/7e15e045-3112-419f-8116-3226c0884ac1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'ea7e9f'},body:JSON.stringify({sessionId:'ea7e9f',hypothesisId:'H3',location:'DevNavigationPanel.tsx:currentNavTarget',message:'panel selection changed',data:{selectedElementId,screenKey,currentToScreenId:current?.toScreenId,currentToAnchor:current?.toAnchor,allStoredKeys:Object.keys(state)},timestamp:Date.now()})}).catch(()=>{});
  }, [selectedElementId, screenKey]);
  // #endregion

  const handleNavTargetChange = (nav: { toScreenId?: string; toAnchor?: string }) => {
    if (!selectedElementId) return;
    // Send only the single entry being edited; resolver merges into existing navTargets so other buttons are unchanged.
    const navTargetsMap = getState()?.layoutByScreen?.[screenKey]?.navTargets;
    const resolvedNavTarget = { toScreenId: nav?.toScreenId, toAnchor: nav?.toAnchor };
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/7e15e045-3112-419f-8116-3226c0884ac1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'22d4f7'},body:JSON.stringify({sessionId:'22d4f7',hypothesisId:'H2,H4',location:'DevNavigationPanel.tsx:handleNavTargetChange',message:'SAVE breakpoint',data:{stage:'STATE_WRITE',screenKey,selectedElementId,dataNodeId:selectedElementId,navTargetsMapKeys:navTargetsMap?Object.keys(navTargetsMap):[],resolvedNavTarget,singleEntryKey:selectedElementId},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    logNavSave({
      screenKey,
      elementId: selectedElementId,
      navTargetsMap: navTargetsMap ?? undefined,
      resolvedNavTarget,
    });
    const singleEntry = { [selectedElementId]: nav };
    if (DEBUG_NAV && typeof console !== "undefined" && console.log) {
      console.log("[NavDebug] DevNavigationPanel save", { screenKey, selectedElementId, nav });
    }
    const logData = { screenKey, selectedElementId, toScreenId: nav?.toScreenId, toAnchor: nav?.toAnchor };
    setNavDebug({ type: "save", screenKey, selectedElementId, toScreenId: nav?.toScreenId, toAnchor: nav?.toAnchor, updatedKeys: [selectedElementId] });
    fetch('http://127.0.0.1:7242/ingest/7e15e045-3112-419f-8116-3226c0884ac1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'ea7e9f'},body:JSON.stringify({sessionId:'ea7e9f',hypothesisId:'H1,H5',location:'DevNavigationPanel.tsx:handleNavTargetChange',message:'saving nav target',data:logData,timestamp:Date.now()})}).catch(()=>{});
    if (typeof console !== "undefined" && console.log) console.log("[NavDebug] SAVE", logData);
    dispatchState("layout.setNavTargets", { screenKey, navTargets: singleEntry });
    // After save: print full state table (next tick so state has been merged)
    setTimeout(() => logNavStateTableAfterSave(screenKey), 0);
  };

  const handleFlowStepChange = (anchor: string) => {
    if (!selectedElementId) return;
    handleNavTargetChange({ toScreenId: SAME_PAGE_SCREEN_ID, toAnchor: anchor });
  };

  const currentFlowStepAnchor =
    flowMode && currentNavTarget?.toScreenId === SAME_PAGE_SCREEN_ID && currentNavTarget?.toAnchor
      ? currentNavTarget.toAnchor
      : "";

  return (
    <div
      style={{
        padding: "var(--spacing-4, 16px) 0",
        borderBottom: "1px solid var(--color-border, #e5e7eb)",
        marginBottom: "var(--spacing-4, 16px)",
      }}
    >
      <h3
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--color-text-primary, #111)",
          margin: "0 0 12px 0",
        }}
      >
        Navigation
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <label style={{ fontSize: 12, color: "var(--color-text-secondary, #666)", fontWeight: 500 }}>
          Edit navigation for:
        </label>
        <select
          value={selectedElementId}
          onChange={(e) => setSelectedElementId(e.target.value)}
          style={{
            fontSize: 12,
            padding: "6px 8px",
            minWidth: 180,
            borderRadius: 6,
            border: "1px solid var(--color-border, #e5e7eb)",
            background: "var(--color-surface-1, #fff)",
          }}
          aria-label="Edit navigation for"
        >
          <option value="">— Select button or card —</option>
          {navigableElements.map((el) => (
            <option key={el.id} value={el.id}>
              {el.label}
            </option>
          ))}
        </select>
        {selectedElementId && (
          <>
            {flowMode && (
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--color-text-secondary, #666)" }}>
                <input
                  type="checkbox"
                  checked={advancedMode}
                  onChange={(e) => setAdvancedMode(e.target.checked)}
                  aria-label="Advanced mode: full screen list"
                />
                Advanced Mode (all screens)
              </label>
            )}
            {flowMode && !advancedMode ? (
              <div key={selectedElementId} style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 4 }}>
                <label style={{ fontSize: 11, color: "#666" }}>Scroll to step</label>
                <select
                  key={selectedElementId}
                  value={currentFlowStepAnchor}
                  onChange={(e) => handleFlowStepChange(e.target.value)}
                  style={{ fontSize: 12, padding: "6px 8px", minWidth: 180, borderRadius: 6, border: "1px solid var(--color-border, #e5e7eb)", background: "var(--color-surface-1, #fff)" }}
                  aria-label={`Step for ${selectedElementId}`}
                >
                  <option value="">— None —</option>
                  {CONTAINER_CREATIONS_FLOW_STEPS.map((step) => (
                    <option key={step.anchor} value={step.anchor}>
                      {step.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <LinkTargetPicker
                key={selectedElementId}
                devMode="dev"
                elementId={selectedElementId}
                value={currentNavTarget}
                onChange={handleNavTargetChange}
                label="Navigate to screen"
              />
            )}
          </>
        )}
      </div>
      <NavDebugStrip panelScreenKey={screenKey} />
    </div>
  );
}

function NavDebugStrip({ panelScreenKey }: { panelScreenKey: string }) {
  const lastEvent = useSyncExternalStore(subscribeNavDebug, getNavDebug, getNavDebug);
  useSyncExternalStore(subscribeState, getState, getState);
  const navTargets = getState()?.layoutByScreen?.[panelScreenKey]?.navTargets ?? {};
  const keys = Object.keys(navTargets);
  return (
    <div
      style={{
        marginTop: 12,
        padding: 8,
        fontSize: 10,
        fontFamily: "monospace",
        background: "var(--color-surface-2, #f3f4f6)",
        borderRadius: 6,
        border: "1px solid var(--color-border, #e5e7eb)",
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 4 }}>Debug (panel screenKey)</div>
      <div style={{ wordBreak: "break-all", marginBottom: 4 }}>{panelScreenKey}</div>
      <div style={{ marginBottom: 4 }}>State keys: {keys.length ? keys.join(", ") : "(none)"}</div>
      {keys.length > 0 && (
        <ul style={{ margin: 0, paddingLeft: 16 }}>
          {keys.map((k) => {
            const v = navTargets[k] as { toScreenId?: string; toAnchor?: string } | undefined;
            return (
              <li key={k}>
                {k} → {v?.toScreenId ?? "—"} {v?.toAnchor ?? ""}
              </li>
            );
          })}
        </ul>
      )}
      {lastEvent && (
        <div style={{ marginTop: 6, paddingTop: 6, borderTop: "1px solid #ddd" }}>
          {lastEvent.type === "save" ? (
            <>Last SAVE: el={lastEvent.selectedElementId} toAnchor={lastEvent.toAnchor ?? "—"} keys=[{lastEvent.updatedKeys.join(", ")}]</>
          ) : (
            <>Last CLICK: id={lastEvent.id} navFound={lastEvent.navFound} toAnchor={lastEvent.toAnchor ?? "—"} keys=[{lastEvent.allKeys.join(", ")}]</>
          )}
        </div>
      )}
    </div>
  );
}
