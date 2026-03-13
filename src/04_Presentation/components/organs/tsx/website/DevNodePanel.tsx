"use client";

import React, { useEffect, useState } from "react";
import { useSyncExternalStore } from "react";
import {
  getDevSidebarProps,
  subscribeDevSidebarProps,
  setSelectedLandingNodeId,
  type LandingConfig,
  type LandingFlowScreen,
} from "@/app/ui/control-dock/dev-right-sidebar-store";
import NodeInspector from "@/app/ui/control-dock/editor/NodeInspector";
import { getEditorMode, subscribeEditorMode } from "@/07_Dev_Tools/editor/editor-mode-store";
import { getOverride, setOverride, subscribe } from "./node-order-override-store";

/** Merge patch into target. Arrays in patch replace the existing value (no partial merge). */
function deepMerge<T extends Record<string, unknown>>(target: T, patch: Partial<T>): T {
  const merged = Object.keys(patch as Record<string, unknown>).reduce(
    (acc: Record<string, unknown>, key) => {
      const value = (patch as Record<string, unknown>)[key];
      if (Array.isArray(value)) {
        acc[key] = value;
      } else if (value != null && typeof value === "object" && !Array.isArray(value)) {
        acc[key] = deepMerge(
          ((target as Record<string, unknown>)[key] as Record<string, unknown>) || {},
          value as Record<string, unknown>
        );
      } else {
        acc[key] = value;
      }
      return acc;
    },
    {} as Record<string, unknown>
  );
  return { ...target, ...merged } as T;
}

function moveItem(arr: string[], index: number, direction: "up" | "down"): string[] {
  const next = [...arr];
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= next.length) return next;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

const PLACEHOLDER = (
  <div style={{ fontSize: 14, color: "var(--color-text-secondary, #5f6368)" }}>
    Nodes
  </div>
);

/** Landing flow node list with connections (nextScreenId, goto targets). */
function LandingFlowNodes({ screens }: { screens: LandingFlowScreen[] }) {
  const idSet = new Set(screens.map((s) => s.id));
  const connections: Array<{ from: string; to: string; label: string }> = [];
  screens.forEach((s) => {
    if (s.nextScreenId && idSet.has(s.nextScreenId)) {
      connections.push({ from: s.id, to: s.nextScreenId, label: "next" });
    }
    s.buttons.forEach((b) => {
      if (b.type === "goto" && b.target && idSet.has(b.target)) {
        connections.push({ from: s.id, to: b.target, label: `goto: ${b.target}` });
      }
    });
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-primary, #202124)" }}>
        Landing flow (from JSON)
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {screens.map((screen, index) => (
          <div
            key={screen.id}
            style={{
              padding: "10px 12px",
              background: "var(--color-surface-1, #f1f3f4)",
              borderRadius: 8,
              border: "1px solid var(--color-border, #dadce0)",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary, #202124)" }}>
              {index + 1}. {screen.title}
            </div>
            <div style={{ fontSize: 11, color: "var(--color-text-secondary, #5f6368)", marginTop: 2 }}>
              id: <code style={{ background: "rgba(0,0,0,0.06)", padding: "1px 4px", borderRadius: 4 }}>{screen.id}</code>
              {" · "}
              layout: {screen.layout}
            </div>
            {screen.inlineControls?.length ? (
              <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 4 }}>
                inline: {screen.inlineControls.join(", ")}
              </div>
            ) : null}
            {screen.nextScreenId ? (
              <div style={{ fontSize: 11, marginTop: 4 }}>
                → next: <code style={{ background: "rgba(0,0,0,0.06)", padding: "1px 4px", borderRadius: 4 }}>{screen.nextScreenId}</code>
              </div>
            ) : null}
            {screen.buttons.some((b) => b.type === "goto" && b.target) ? (
              <div style={{ fontSize: 11, marginTop: 2 }}>
                goto: {screen.buttons.filter((b) => b.type === "goto" && b.target).map((b) => b.target).join(", ")}
              </div>
            ) : null}
            {screen.nodePosition ? (
              <div style={{ fontSize: 10, color: "var(--color-text-secondary)", marginTop: 2 }}>
                position: ({screen.nodePosition.x}, {screen.nodePosition.y})
              </div>
            ) : null}
          </div>
        ))}
      </div>
      {connections.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 4 }}>
            Connections
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2, fontSize: 11, color: "var(--color-text-secondary)" }}>
            {connections.map((c, i) => (
              <div key={`${c.from}-${c.to}-${i}`}>
                {c.from} → {c.to} {c.label !== "next" ? `(${c.label})` : ""}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Landing (JSON config) node list: reorderable rows with id, title, layout and connections (nextScreenId, goto targets). */
function LandingConfigNodes({
  config,
  orderOverride,
  onReorder,
  selectedNodeId,
  onSelectNode,
}: {
  config: LandingConfig;
  orderOverride: string[] | undefined;
  onReorder: (newOrder: string[]) => void;
  selectedNodeId?: string | null;
  onSelectNode?: (id: string) => void;
}) {
  const baseOrder = config.screens.map((s) => s.id);
  const effectiveOrder = orderOverride ?? baseOrder;
  const orderedScreens = effectiveOrder
    .map((id) => config.screens.find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => s != null);

  const handleMove = (index: number, direction: "up" | "down") => {
    const next = moveItem(effectiveOrder, index, direction);
    onReorder(next);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-primary, #202124)" }}>
        Landing flow (from JSON)
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {orderedScreens.map((screen, index) => {
          const isSelected = selectedNodeId === screen.id;
          return (
            <div
              key={screen.id}
              data-node-row-id={screen.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectNode?.(screen.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectNode?.(screen.id);
                }
              }}
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                padding: "10px 12px",
                background: isSelected ? "var(--color-surface-hover, #e8eaed)" : "var(--color-surface-1, #f1f3f4)",
                borderRadius: 6,
                border: "1px solid var(--color-border, #dadce0)",
                outline: isSelected ? "2px solid var(--color-accent, #1a73e8)" : "none",
                outlineOffset: 1,
                gap: 8,
                cursor: onSelectNode ? "pointer" : undefined,
                transition: "background 120ms ease",
              }}
              onMouseEnter={(e) => {
                if (onSelectNode && !isSelected) {
                  e.currentTarget.style.background = "var(--color-surface-hover, #e8eaed)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = "var(--color-surface-1, #f1f3f4)";
                }
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: "var(--color-text-primary, #202124)" }}>
                  {screen.id} — {screen.title} ({screen.layout})
                </div>
                {screen.nextScreenId ? (
                  <div style={{ fontSize: 11, color: "var(--color-text-secondary, #5f6368)", marginTop: 2 }}>
                    Next → {screen.nextScreenId}
                  </div>
                ) : null}
                {screen.buttons?.some((b) => b.type === "goto" && b.target) ? (
                  <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>
                    {screen.buttons
                      .filter((b) => b.type === "goto" && b.target)
                      .map((b) => `→ ${b.target}`)
                      .join(" · ")}
                  </div>
                ) : null}
              </div>
              <div style={{ display: "flex", gap: 4, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => handleMove(index, "up")}
                  disabled={index === 0}
                  style={{
                    padding: "4px 8px",
                    fontSize: 12,
                    border: "1px solid var(--color-border)",
                    borderRadius: 6,
                    background: index === 0 ? "var(--color-bg-muted)" : "var(--color-bg-primary)",
                    cursor: index === 0 ? "not-allowed" : "pointer",
                  }}
                >
                  Up
                </button>
                <button
                  type="button"
                  onClick={() => handleMove(index, "down")}
                  disabled={index === orderedScreens.length - 1}
                  style={{
                    padding: "4px 8px",
                    fontSize: 12,
                    border: "1px solid var(--color-border)",
                    borderRadius: 6,
                    background: index === orderedScreens.length - 1 ? "var(--color-bg-muted)" : "var(--color-bg-primary)",
                    cursor: index === orderedScreens.length - 1 ? "not-allowed" : "pointer",
                  }}
                >
                  Down
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DevNodePanel({ screenPath }: { screenPath: string }) {
  const [mounted, setMounted] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  useEffect(() => setMounted(true), []);

  const props = useSyncExternalStore(subscribeDevSidebarProps, getDevSidebarProps, getDevSidebarProps);
  const override = useSyncExternalStore(subscribe, () => getOverride(screenPath), () => getOverride(screenPath));
  const editorMode = useSyncExternalStore(subscribeEditorMode, getEditorMode, getEditorMode);
  /** Strict equality: screenPath must be the canonical key (getCanonicalScreenKey) so read/write use the same key. */
  const isWebsiteScreen = props?.websiteScreenPath != null && props.websiteScreenPath === screenPath;
  const baseOrder = props?.websiteNodeOrder ?? [];
  const effectiveOrder = override ?? baseOrder;
  const landingFlowScreens = props?.landingFlowScreens ?? [];
  const isLandingConfig =
    props?.landingScreenPath != null &&
    props?.landingScreenPath === screenPath &&
    props?.landingConfig != null;

  // Sync local selection to store (node list → canvas highlight)
  useEffect(() => {
    if (isLandingConfig) {
      setSelectedLandingNodeId(selectedNodeId);
    }
    return () => {
      if (isLandingConfig) setSelectedLandingNodeId(null);
    };
  }, [isLandingConfig, selectedNodeId]);

  // Sync store to local when canvas click selects a node (canvas → node list selection + scroll)
  useEffect(() => {
    if (!isLandingConfig || props?.selectedLandingNodeId == null) return;
    if (props.selectedLandingNodeId !== selectedNodeId) {
      setSelectedNodeId(props.selectedLandingNodeId);
    }
  }, [isLandingConfig, props?.selectedLandingNodeId]);

  // Prevent invalid selection when config changes (e.g. screens removed)
  const screens = props?.landingConfig?.screens ?? [];
  useEffect(() => {
    if (!isLandingConfig || !selectedNodeId) return;
    if (!screens.some((s) => s.id === selectedNodeId)) {
      setSelectedNodeId(null);
    }
  }, [isLandingConfig, selectedNodeId, screens]);

  // Bidirectional scroll: when selection changes, scroll the node row into view in the list
  useEffect(() => {
    if (!isLandingConfig || !selectedNodeId) return;
    const rowEl = document.querySelector(`[data-node-row-id="${selectedNodeId}"]`);
    if (rowEl) {
      rowEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [isLandingConfig, selectedNodeId]);

  function updateNode(nodeId: string, patch: Partial<LandingFlowScreen> & Record<string, unknown>) {
    const config = props?.landingConfig;
    const onChange = props?.onLandingConfigChange;
    if (!config || !onChange) return;
    const newScreens = config.screens.map((s) =>
      s.id === nodeId ? deepMerge(s as Record<string, unknown>, patch as Record<string, unknown>) : s
    ) as LandingConfig["screens"];
    onChange({ ...config, screens: newScreens });
  }

  if (!mounted) {
    return PLACEHOLDER;
  }

  if (isLandingConfig && props.landingConfig) {
    const node = selectedNodeId
      ? props.landingConfig.screens.find((s) => s.id === selectedNodeId)
      : null;
    const isEditorMode = editorMode === "editor";
    const baseOrder = props.landingConfig.screens.map((s) => s.id);
    const effectiveOrder = override ?? baseOrder;
    const orderedScreens = effectiveOrder
      .map((id) => props.landingConfig!.screens.find((s) => s.id === id))
      .filter((s): s is NonNullable<typeof s> => s != null);

    const handleNodeListKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        const idx = selectedNodeId ? orderedScreens.findIndex((s) => s.id === selectedNodeId) : -1;
        if (e.key === "ArrowDown" && idx >= 0 && idx < orderedScreens.length - 1) {
          e.preventDefault();
          setSelectedNodeId(orderedScreens[idx + 1].id);
        } else if (e.key === "ArrowUp" && idx > 0) {
          e.preventDefault();
          setSelectedNodeId(orderedScreens[idx - 1].id);
        }
      }
    };

    return (
      <div
        style={{ display: "flex", flexDirection: "column", gap: 0 }}
        tabIndex={0}
        onKeyDown={handleNodeListKeyDown}
        role="region"
        aria-label="Node list"
      >
        <LandingConfigNodes
          config={props.landingConfig}
          orderOverride={override}
          onReorder={(newOrder) => setOverride(screenPath, newOrder)}
          selectedNodeId={selectedNodeId}
          onSelectNode={setSelectedNodeId}
        />
        {isEditorMode && selectedNodeId && node ? (
          <NodeInspector
            node={node as Parameters<typeof NodeInspector>[0]["node"]}
            screenIds={props.landingConfig.screens.map((s) => s.id)}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
            onChange={(patch) => updateNode(selectedNodeId, patch as Partial<LandingFlowScreen> & Record<string, unknown>)}
          />
        ) : null}
      </div>
    );
  }

  if (landingFlowScreens.length > 0) {
    return <LandingFlowNodes screens={landingFlowScreens} />;
  }

  if (!screenPath) {
    return (
      <div style={{ fontSize: 14, color: "var(--color-text-secondary, #5f6368)" }}>
        Select a TSX website screen to reorder nodes, or load Container Creations landing to see flow.
      </div>
    );
  }

  if (!isWebsiteScreen || effectiveOrder.length === 0) {
    return (
      <div style={{ fontSize: 14, color: "var(--color-text-secondary, #5f6368)" }}>
        Load a TSX website screen to see node order.
      </div>
    );
  }

  const handleMove = (index: number, direction: "up" | "down") => {
    const next = moveItem(effectiveOrder, index, direction);
    setOverride(screenPath, next);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-primary, #202124)" }}>Node order</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {effectiveOrder.map((id, index) => (
          <div
            key={id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 10px",
              background: "var(--color-surface-1, #f1f3f4)",
              borderRadius: 8,
              border: "1px solid var(--color-border, #dadce0)",
            }}
          >
            <span style={{ fontSize: 13, color: "var(--color-text-primary, #202124)" }}>{id}</span>
            <div style={{ display: "flex", gap: 4 }}>
              <button
                type="button"
                onClick={() => handleMove(index, "up")}
                disabled={index === 0}
                style={{
                  padding: "4px 8px",
                  fontSize: 12,
                  border: "1px solid var(--color-border)",
                  borderRadius: 6,
                  background: index === 0 ? "var(--color-bg-muted)" : "var(--color-bg-primary)",
                  cursor: index === 0 ? "not-allowed" : "pointer",
                }}
              >
                Up
              </button>
              <button
                type="button"
                onClick={() => handleMove(index, "down")}
                disabled={index === effectiveOrder.length - 1}
                style={{
                  padding: "4px 8px",
                  fontSize: 12,
                  border: "1px solid var(--color-border)",
                  borderRadius: 6,
                  background: index === effectiveOrder.length - 1 ? "var(--color-bg-muted)" : "var(--color-bg-primary)",
                  cursor: index === effectiveOrder.length - 1 ? "not-allowed" : "pointer",
                }}
              >
                Down
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
