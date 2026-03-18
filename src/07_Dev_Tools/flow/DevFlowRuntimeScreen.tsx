"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FlowEngine } from "@/engine/onboarding/flow-engine/FlowEngine";
import type { FlowConfig, FlowScreen } from "@/engine/onboarding/flow-engine/types";
import { setDevFlowProps } from "@/app/ui/control-dock/dev-right-sidebar-store";
import { useDevFlowAdapter } from "./DevFlowAdapter";

function moveItem<T>(arr: T[], index: number, direction: "up" | "down"): T[] {
  const next = [...arr];
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= next.length) return next;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

function FlowEngineDevTile({
  config,
  screen,
  onSelect,
  index,
}: {
  config: FlowConfig;
  screen: FlowScreen;
  onSelect: (id: string) => void;
  index: number;
}) {
  const tileRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = tileRef.current;
    if (!root) return;

    const elements = Array.from(root.querySelectorAll<HTMLElement>("[data-node-id]"));
    const scopedIds: string[] = [];

    elements.forEach((el) => {
      const raw = el.getAttribute("data-node-id");
      if (!raw) return;
      // Scope node ids by screen id + instance index so each grid tile
      // has a unique namespace, avoiding duplicate data-node-id collisions
      // across multiple FlowEngine instances.
      const scoped = `${screen.id}__${index}__${raw}`;
      el.setAttribute("data-node-id", scoped);
      scopedIds.push(scoped);
    });

    if (process.env.NODE_ENV === "development" && typeof console !== "undefined" && console.log) {
      console.log("[DevFlowRuntimeScreen] Scoped data-node-id for grid tile", {
        screenId: screen.id,
        instanceIndex: index,
        total: scopedIds.length,
        sample: scopedIds.slice(0, 20),
      });
    }
  }, [config, screen.id, index]);

  return (
    <div
      ref={tileRef}
      style={{
        width: "100%",
        maxWidth: 420,
        background: "var(--color-canvas, #f5f7fa)",
        borderRadius: 12,
        overflow: "hidden",
        border: "1px solid rgba(0,0,0,0.08)",
      }}
      onClick={() => onSelect(screen.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(screen.id);
        }
      }}
      data-flow-screen-id={screen.id}
      data-flow-screen-instance={index}
    >
      <FlowEngine
        config={config}
        currentScreenId={screen.id}
        onNavigateScreenId={onSelect}
      />
    </div>
  );
}

function FlowEngineDevGrid({
  config,
  onSelect,
}: {
  config: FlowConfig;
  onSelect: (id: string) => void;
}) {
  return (
    <div
      data-flow-engine-dev-grid
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
        gap: 24,
        alignItems: "start",
        justifyItems: "center",
        width: "100%",
        maxWidth: 1400,
        margin: "0 auto",
        padding: "0 16px",
        boxSizing: "border-box",
      }}
    >
      {config.screens.map((screen, index) => (
        <FlowEngineDevTile
          key={screen.id}
          config={config}
          screen={screen}
          index={index}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

export default function DevFlowRuntimeScreen() {
  const searchParams = useSearchParams();
  const screenPath = searchParams.get("screen") ?? "";
  const flowId = searchParams.get("flowId");
  const configUrl = searchParams.get("configUrl") ?? undefined;

  useEffect(() => {
    if (typeof console !== "undefined" && console.log) {
      console.log("FLOW RUNTIME MOUNTED", { flowId, configUrl, screenPath });
    }
  }, [flowId, configUrl, screenPath]);

  const [fetchedConfig, setFetchedConfig] = useState<FlowConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!flowId && !configUrl) {
      setError("flowId or configUrl required");
      setFetchedConfig(null);
      return;
    }
    const url = configUrl
      ? `${configUrl}${configUrl.includes("?") ? "&" : "?"}t=${Date.now()}`
      : `/api/flows/${encodeURIComponent(flowId ?? "")}?t=${Date.now()}`;
    fetch(url, { cache: "no-store", headers: { Pragma: "no-cache" } })
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then((data) => {
        setFetchedConfig(data as FlowConfig);
        setError(null);
      })
      .catch((err) => {
        setError(err?.message ?? "Failed to load flow");
        setFetchedConfig(null);
      });
  }, [flowId, configUrl]);

  // Register config into the dev store so Nodes panel can edit/reorder.
  useEffect(() => {
    if (!screenPath || !fetchedConfig?.screens?.length) return;
    setDevFlowProps(screenPath, fetchedConfig, fetchedConfig.screens[0]?.id ?? null);
  }, [screenPath, fetchedConfig]);

  useEffect(() => {
    if (process.env.NODE_ENV === "development" && typeof console !== "undefined" && console.log) {
      console.log("DEV FLOW SCREEN ACTIVE — DevFlowRuntimeScreen mounted", { screenPath, flowId, screensCount: fetchedConfig?.screens?.length });
    }
  }, [screenPath, flowId, fetchedConfig?.screens?.length]);

  const adapter = useDevFlowAdapter(screenPath);

  const effectiveConfig = adapter.flowConfig ?? fetchedConfig;
  const currentScreenId = adapter.currentScreenId;

  const render = useMemo(() => {
    if (!effectiveConfig) return null;
    if (adapter.deviceMode === "phoneGrid") {
      return <FlowEngineDevGrid config={effectiveConfig} onSelect={adapter.onSelect} />;
    }
    return (
      <FlowEngine
        config={effectiveConfig}
        currentScreenId={currentScreenId}
        onNavigateScreenId={adapter.onSelect}
        className="flow-runtime-screen"
      />
    );
  }, [effectiveConfig, adapter.deviceMode, adapter.onSelect, currentScreenId]);

  if (error) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-secondary, #94a3b8)" }}>
        Failed to load flow: {error}
      </div>
    );
  }

  if (!fetchedConfig || !fetchedConfig.screens?.length) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-secondary, #94a3b8)" }}>
        Loading…
      </div>
    );
  }

  return render;
}

