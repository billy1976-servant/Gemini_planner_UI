"use client";

import React, { useEffect, useState } from "react";
import { useSyncExternalStore } from "react";
import { getDevSidebarProps, subscribeDevSidebarProps } from "@/app/ui/control-dock/dev-right-sidebar-store";
import { getOverride, setOverride, subscribe } from "./node-order-override-store";

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

export function DevNodePanel({ screenPath }: { screenPath: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const props = useSyncExternalStore(subscribeDevSidebarProps, getDevSidebarProps, getDevSidebarProps);
  const override = useSyncExternalStore(subscribe, () => getOverride(screenPath), () => getOverride(screenPath));
  const isWebsiteScreen = props?.websiteScreenPath != null && props.websiteScreenPath === screenPath;
  const baseOrder = props?.websiteNodeOrder ?? [];
  const effectiveOrder = override ?? baseOrder;

  if (!mounted) {
    return PLACEHOLDER;
  }

  if (!screenPath) {
    return (
      <div style={{ fontSize: 14, color: "var(--color-text-secondary, #5f6368)" }}>
        Select a TSX website screen to reorder nodes.
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
