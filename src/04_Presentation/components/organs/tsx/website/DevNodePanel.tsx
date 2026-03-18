"use client";

import React, { useEffect, useState } from "react";
import { useSyncExternalStore } from "react";
import {
  getDevSidebarProps,
  subscribeDevSidebarProps,
  setSelectedLandingNodeId,
  setSelectedFlowNodeId,
  type LandingConfig,
  type LandingFlowScreen,
  setDevFlowConfig,
} from "@/app/ui/control-dock/dev-right-sidebar-store";
import NodeInspector from "@/app/ui/control-dock/editor/NodeInspector";
import { getEditorMode, subscribeEditorMode } from "@/07_Dev_Tools/editor/editor-mode-store";
import { getOverride, setOverride, subscribe } from "./node-order-override-store";
import {
  getCurrentScreenTree,
  getCurrentScreenTreeScreenKey,
  subscribeCurrentScreenTree,
} from "@/engine/core/current-screen-tree-store";
import type { FlowConfig, FlowScreen, FlowButtonBlock } from "@/engine/onboarding/flow-engine/types";

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

type JsonNodeLike = {
  type?: unknown;
  id?: unknown;
  key?: unknown;
  params?: unknown;
  children?: unknown;
};

type JsonNodeRow = {
  rowId: string;
  type: string;
  id: string;
  depth: number;
  childCount: number;
};

function getJsonNodeId(node: JsonNodeLike): string {
  if (typeof node.id === "string" && node.id.trim()) return node.id;
  if (typeof node.key === "string" && node.key.trim()) return node.key;
  const params = node.params as Record<string, unknown> | null;
  const paramsId = params && typeof params === "object" ? params["id"] : null;
  if (typeof paramsId === "string" && paramsId.trim()) return paramsId;
  return "";
}

function buildJsonNodeRows(root: unknown): JsonNodeRow[] {
  const rows: JsonNodeRow[] = [];
  const visit = (node: unknown, depth: number, path: string) => {
    if (!node || typeof node !== "object") return;
    const n = node as JsonNodeLike;
    const type = typeof n.type === "string" ? n.type : "unknown";
    const id = getJsonNodeId(n);
    const children = Array.isArray(n.children) ? (n.children as unknown[]) : [];
    const rowId = `${path}/${type}:${id || "(no-id)"}`;
    rows.push({
      rowId,
      type,
      id,
      depth,
      childCount: children.length,
    });
    children.forEach((c, i) => visit(c, depth + 1, `${rowId}[${i}]`));
  };
  visit(root, 0, "root");
  return rows;
}

function JsonScreenNodes({ root }: { root: unknown }) {
  const rows = buildJsonNodeRows(root);
  if (rows.length === 0) {
    return (
      <div style={{ fontSize: 14, color: "var(--color-text-secondary, #5f6368)" }}>
        No JSON nodes found.
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-primary, #202124)" }}>
        Screen structure (from JSON)
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {rows.map((r) => (
          <div
            key={r.rowId}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "6px 10px",
              background: "var(--color-surface-1, #f1f3f4)",
              borderRadius: 8,
              border: "1px solid var(--color-border, #dadce0)",
              marginLeft: r.depth * 12,
              gap: 8,
              minWidth: 0,
            }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 12, color: "var(--color-text-primary, #202124)" }}>
                <span style={{ fontWeight: 600 }}>{r.type}</span>
                {r.id ? (
                  <>
                    {" "}
                    <span style={{ color: "var(--color-text-secondary, #5f6368)" }}>·</span>{" "}
                    <code style={{ background: "rgba(0,0,0,0.06)", padding: "1px 4px", borderRadius: 4 }}>
                      {r.id}
                    </code>
                  </>
                ) : null}
              </div>
            </div>
            <div style={{ fontSize: 11, color: "var(--color-text-secondary, #5f6368)", flexShrink: 0 }}>
              {r.childCount ? `${r.childCount} child${r.childCount === 1 ? "" : "ren"}` : ""}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

type FlowNode = {
  id: string;
  type: string;
  children: FlowNode[];
};

function buildFlowNodeTree(config: FlowConfig): FlowNode {
  const children: FlowNode[] = (config.screens ?? []).map((s) => ({
    id: s.id,
    type: "flow-screen",
    children: [],
  }));
  return {
    id: config.id,
    type: "flow",
    children,
  };
}

function FlowConfigNodes({
  config,
  selectedNodeId,
  onSelectNode,
  onReorder,
}: {
  config: FlowConfig;
  selectedNodeId?: string | null;
  onSelectNode?: (id: string) => void;
  onReorder?: (newOrder: string[]) => void;
}) {
  const nodes = buildFlowNodeTree(config);
  const screensById = new Map<string, FlowScreen>(
    (config.screens ?? []).map((s) => [s.id, s])
  );
  const rows: Array<{ node: FlowNode; depth: number; screenIndex: number }> = [];
  let screenIndex = -1;
  const visit = (node: FlowNode, depth: number) => {
    if (node.type === "flow-screen") screenIndex += 1;
    rows.push({ node, depth, screenIndex: node.type === "flow-screen" ? screenIndex : -1 });
    node.children.forEach((c) => visit(c, depth + 1));
  };
  visit(nodes, 0);

  const screenIds = config.screens?.map((s) => s.id) ?? [];
  const handleMove = (index: number, direction: "up" | "down") => {
    if (!onReorder || index < 0 || index >= screenIds.length) return;
    const next = moveItem(screenIds, index, direction);
    onReorder(next);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-primary, #202124)" }}>
        Flow screens (from JSON config)
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {rows.map(({ node, depth, screenIndex }) => {
          const isRoot = depth === 0;
          const isSelected = selectedNodeId === node.id;
          const flowScreen = screensById.get(node.id);
          return (
            <div
              key={`${node.type}:${node.id}:${depth}`}
              data-node-row-id={node.id}
              role={isRoot ? undefined : "button"}
              tabIndex={isRoot ? -1 : 0}
              onClick={(e) => {
                if (!isRoot) {
                  onSelectNode?.(node.id);
                  (e as React.MouseEvent).stopPropagation();
                }
              }}
              onKeyDown={(e) => {
                if (isRoot) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectNode?.(node.id);
                }
              }}
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                padding: "8px 10px",
                background: isSelected
                  ? "var(--color-surface-hover, #e8eaed)"
                  : "var(--color-surface-1, #f1f3f4)",
                borderRadius: 6,
                border: "1px solid var(--color-border, #dadce0)",
                outline: isSelected ? "2px solid var(--color-accent, #1a73e8)" : "none",
                outlineOffset: 1,
                marginLeft: depth * 12,
                cursor: isRoot ? "default" : "pointer",
                transition: "background 120ms ease",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: "var(--color-text-primary, #202124)" }}>
                  <span style={{ fontWeight: 600 }}>{node.type}</span>
                  {node.id ? (
                    <>
                      {" "}
                      <span style={{ color: "var(--color-text-secondary, #5f6368)" }}>·</span>{" "}
                      <code
                        style={{
                          background: "rgba(0,0,0,0.06)",
                          padding: "1px 4px",
                          borderRadius: 4,
                        }}
                      >
                        {node.id}
                      </code>
                    </>
                  ) : null}
                </div>
                {flowScreen ? (
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--color-text-secondary, #5f6368)",
                      marginTop: 2,
                    }}
                  >
                    {flowScreen.title} ({flowScreen.layout})
                    {flowScreen.nextScreenId
                      ? ` • next → ${flowScreen.nextScreenId}`
                      : ""}
                  </div>
                ) : null}
              </div>
              {!isRoot ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  {flowScreen?.buttons?.length ? (
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--color-text-secondary, #5f6368)",
                      }}
                    >
                      {flowScreen.buttons
                        .filter((b) => b.type === "goto" && "target" in b)
                        .map((b) => (b as Extract<FlowButtonBlock, { type: "goto" }>).target)
                        .join(" · ")}
                    </span>
                  ) : null}
                  {screenIndex >= 0 && onReorder ? (
                    <div onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleMove(screenIndex, "up")}
                        disabled={screenIndex === 0}
                        style={{
                          padding: "4px 8px",
                          fontSize: 12,
                          border: "1px solid var(--color-border)",
                          borderRadius: 6,
                          background: screenIndex === 0 ? "var(--color-bg-muted)" : "var(--color-bg-primary)",
                          cursor: screenIndex === 0 ? "not-allowed" : "pointer",
                        }}
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(screenIndex, "down")}
                        disabled={screenIndex >= screenIds.length - 1}
                        style={{
                          padding: "4px 8px",
                          fontSize: 12,
                          border: "1px solid var(--color-border)",
                          borderRadius: 6,
                          background: screenIndex >= screenIds.length - 1 ? "var(--color-bg-muted)" : "var(--color-bg-primary)",
                          cursor: screenIndex >= screenIds.length - 1 ? "not-allowed" : "pointer",
                        }}
                        title="Move down"
                      >
                        ↓
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
  const currentTree = useSyncExternalStore(subscribeCurrentScreenTree, getCurrentScreenTree, getCurrentScreenTree);
  const currentTreeScreenKey = useSyncExternalStore(
    subscribeCurrentScreenTree,
    getCurrentScreenTreeScreenKey,
    getCurrentScreenTreeScreenKey
  );
  /** Strict equality: screenPath must be the canonical key (getCanonicalScreenKey) so read/write use the same key. */
  const isWebsiteScreen = props?.websiteScreenPath != null && props.websiteScreenPath === screenPath;
  const baseOrder = props?.websiteNodeOrder ?? [];
  const effectiveOrder = override ?? baseOrder;
  const landingFlowScreens = props?.landingFlowScreens ?? [];
  const isLandingConfig =
    props?.landingScreenPath != null &&
    props?.landingScreenPath === screenPath &&
    props?.landingConfig != null;
  const flowConfig = props?.flowConfig ?? null;
  const hasFlowConfig =
    !!flowConfig &&
    typeof props?.flowScreenPath === "string" &&
    props.flowScreenPath === screenPath;

  // Sync local selection to store (node list → canvas highlight)
  useEffect(() => {
    if (isLandingConfig) {
      setSelectedLandingNodeId(selectedNodeId);
    }
    return () => {
      if (isLandingConfig) setSelectedLandingNodeId(null);
    };
  }, [isLandingConfig, selectedNodeId]);

  // Sync flow selection to store and clear when leaving flow mode.
  // Guard: only write when store value differs to avoid listener → re-render → write → loop.
  useEffect(() => {
    if (!hasFlowConfig) return;
    if (props?.selectedFlowNodeId === selectedNodeId) return;
    setSelectedFlowNodeId(selectedNodeId);
    return () => {
      if (hasFlowConfig) setSelectedFlowNodeId(null);
    };
  }, [hasFlowConfig, selectedNodeId, props?.selectedFlowNodeId]);

  // Sync store to local when selection changes from elsewhere (e.g. canvas)
  useEffect(() => {
    if (!hasFlowConfig || props?.selectedFlowNodeId == null) return;
    if (props.selectedFlowNodeId !== selectedNodeId) {
      setSelectedNodeId(props.selectedFlowNodeId);
    }
  }, [hasFlowConfig, props?.selectedFlowNodeId, selectedNodeId]);

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

  // Prevent invalid flow selection when screens are reordered/removed
  const flowScreens = flowConfig?.screens ?? [];
  useEffect(() => {
    if (!hasFlowConfig || !selectedNodeId) return;
    if (!flowScreens.some((s) => s.id === selectedNodeId)) {
      setSelectedNodeId(null);
    }
  }, [hasFlowConfig, selectedNodeId, flowScreens]);

  // Bidirectional scroll: when selection changes, scroll the node row into view in the list
  useEffect(() => {
    if (!isLandingConfig || !selectedNodeId) return;
    const rowEl = document.querySelector(`[data-node-row-id="${selectedNodeId}"]`);
    if (rowEl) {
      rowEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [isLandingConfig, selectedNodeId]);

  // Scroll flow node into view when selected
  useEffect(() => {
    if (!hasFlowConfig || !selectedNodeId) return;
    const rowEl = document.querySelector(`[data-node-row-id="${selectedNodeId}"]`);
    if (rowEl) {
      rowEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [hasFlowConfig, selectedNodeId]);

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

  if (hasFlowConfig && flowConfig) {
    const isEditorMode = editorMode === "editor";
    const node =
      selectedNodeId && flowConfig.screens
        ? flowConfig.screens.find((s) => s.id === selectedNodeId)
        : null;

    const toEditableNode = (screen: FlowScreen) => {
      return {
        id: screen.id,
        title: screen.title,
        subtitle: screen.subtitle,
        layout: screen.layout,
        nextScreenId: screen.nextScreenId,
        buttons: (screen.buttons ?? []).map((b) => {
          const base: { type?: string; label?: string; target?: string } = {
            type: (b as FlowButtonBlock).type,
          };
          if ("label" in b && typeof b.label === "string") {
            base.label = b.label;
          }
          if (b.type === "goto" && "target" in b) {
            base.target = String(b.target);
          } else if (b.type === "link") {
            const hrefKey = "hrefKey" in b ? b.hrefKey : undefined;
            const href = "href" in b ? b.href : undefined;
            base.target = (hrefKey || href) ?? undefined;
          }
          return base;
        }),
        content: (screen.content ?? []).map((block) => {
          const out: Record<string, unknown> = { type: (block as any).type };
          if ("text" in (block as any)) out.text = (block as any).text;
          if ("heading" in (block as any)) out.heading = (block as any).heading;
          return out;
        }),
      };
    };

    const fromEditableNode = (base: FlowScreen, editable: ReturnType<typeof toEditableNode>): FlowScreen => {
      const next: FlowScreen = { ...base };
      if (editable.title !== undefined) next.title = editable.title ?? "";
      if (editable.subtitle !== undefined) next.subtitle = editable.subtitle ?? "";
      if (editable.layout !== undefined) next.layout = editable.layout as FlowScreen["layout"];
      if (editable.nextScreenId !== undefined) next.nextScreenId = editable.nextScreenId ?? undefined;

      if (editable.content && editable.content.length && next.content) {
        const updatedContent = next.content.map((block, index) => {
          const patchBlock = editable.content?.[index];
          if (!patchBlock) return block;
          const out: Record<string, unknown> = { ...(block as any) };
          if ("text" in patchBlock && patchBlock.text !== undefined) {
            out.text = patchBlock.text;
          }
          if ("heading" in patchBlock && patchBlock.heading !== undefined) {
            out.heading = patchBlock.heading;
          }
          return out as typeof block;
        });
        (next as any).content = updatedContent;
      }

      if (editable.buttons && editable.buttons.length) {
        const existing = next.buttons ?? [];
        const updatedButtons: FlowButtonBlock[] = editable.buttons.map((btn, index) => {
          const prev = existing[index] as FlowButtonBlock | undefined;
          const type = (btn.type as FlowButtonBlock["type"]) ?? prev?.type ?? "next";
          if (type === "goto") {
            const target =
              typeof btn.target === "string"
                ? btn.target
                : (prev && "target" in prev ? (prev as any).target : "");
            return {
              type: "goto",
              label: btn.label ?? (prev && "label" in prev ? (prev as any).label : "") ?? "",
              target,
            };
          }
          if (type === "link") {
            const href =
              typeof btn.target === "string"
                ? btn.target
                : (prev && "href" in prev ? (prev as any).href : undefined);
            const hrefKey = prev && "hrefKey" in prev ? (prev as any).hrefKey : undefined;
            return {
              type: "link",
              label: btn.label ?? (prev && "label" in prev ? (prev as any).label : "") ?? "",
              href,
              hrefKey,
            };
          }
          if (type === "back" || type === "next") {
            return {
              type,
              label: btn.label ?? (prev && "label" in prev ? (prev as any).label : "") ?? "",
            } as FlowButtonBlock;
          }
          if (type === "action") {
            return {
              type: "action",
              label: btn.label ?? (prev && "label" in prev ? (prev as any).label : "") ?? "",
              action: prev && "action" in prev ? (prev as any).action : "",
              params: prev && "params" in prev ? (prev as any).params : undefined,
            };
          }
          return prev ?? { type: "next", label: btn.label ?? "" };
        });
        next.buttons = updatedButtons;
      }

      return next;
    };

    const handleChangeFlowNode = (nodeId: string, patch: Record<string, unknown>) => {
      if (!flowConfig || !flowConfig.screens?.length) return;
      const nextScreens = flowConfig.screens.map((s) => {
        if (s.id !== nodeId) return s;
        const editable = toEditableNode(s);
        const merged = deepMerge(editable as Record<string, unknown>, patch);
        return fromEditableNode(s, merged as ReturnType<typeof toEditableNode>);
      });
      const nextConfig: FlowConfig = { ...flowConfig, screens: nextScreens };
      setDevFlowConfig(nextConfig);
    };

    const handleFlowReorder = (newOrder: string[]) => {
      if (!flowConfig?.screens?.length) return;
      const newScreens = newOrder
        .map((id) => flowConfig.screens!.find((s) => s.id === id))
        .filter((s): s is FlowScreen => s != null);
      if (newScreens.length !== flowConfig.screens.length) return;
      setDevFlowConfig({ ...flowConfig, screens: newScreens });
    };

    const orderedFlowScreens = flowConfig.screens ?? [];
    const handleFlowNodeListKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        const idx = selectedNodeId
          ? orderedFlowScreens.findIndex((s) => s.id === selectedNodeId)
          : -1;
        if (e.key === "ArrowDown" && idx >= 0 && idx < orderedFlowScreens.length - 1) {
          e.preventDefault();
          setSelectedNodeId(orderedFlowScreens[idx + 1].id);
        } else if (e.key === "ArrowUp" && idx > 0) {
          e.preventDefault();
          setSelectedNodeId(orderedFlowScreens[idx - 1].id);
        }
      }
    };

    return (
      <div
        style={{ display: "flex", flexDirection: "column", gap: 0 }}
        role="region"
        aria-label="Flow node list"
        tabIndex={0}
        onKeyDown={handleFlowNodeListKeyDown}
      >
        <FlowConfigNodes
          config={flowConfig}
          selectedNodeId={selectedNodeId}
          onSelectNode={setSelectedNodeId}
          onReorder={handleFlowReorder}
        />
        {isEditorMode && selectedNodeId && node ? (
          <NodeInspector
            node={toEditableNode(node) as Parameters<typeof NodeInspector>[0]["node"]}
            screenIds={flowConfig.screens.map((s) => s.id)}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
            onChange={(patch) =>
              handleChangeFlowNode(
                selectedNodeId,
                patch as Record<string, unknown>
              )
            }
          />
        ) : null}
      </div>
    );
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

  const hasJsonTreeForThisScreen =
    !!screenPath && !!currentTree && currentTreeScreenKey != null && currentTreeScreenKey === screenPath;
  if (hasJsonTreeForThisScreen) {
    return <JsonScreenNodes root={currentTree} />;
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
