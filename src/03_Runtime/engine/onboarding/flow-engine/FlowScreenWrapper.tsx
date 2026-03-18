"use client";

/**
 * Generic wrapper that loads flow config from /api/flows/[flowId] and renders FlowEngine.
 * Dispatches button actions via flowActionRegistry so domain code can register handlers
 * without coupling the flow to a specific app.
 * In dev, uses flowConfig from the dev store when set so panel edits re-render the engine.
 */

import React, { useState, useEffect, useCallback } from "react";
import { FlowEngine } from "./FlowEngine";
import type { FlowConfig, FlowActionContext } from "./types";
import { runFlowAction } from "./flowActionRegistry";
import { setDevFlowProps } from "@/app/ui/control-dock/dev-right-sidebar-store";

export interface FlowScreenWrapperProps {
  /** Flow id used to fetch from /api/flows/[flowId] when configUrl is not set. */
  flowId: string;
  /** Optional: fetch config from this URL instead of /api/flows/[flowId]. */
  configUrl?: string;
  /** Context passed to registered action handlers (e.g. basePath, domain). */
  actionContext?: FlowActionContext;
  /** Optional class name for the root. */
  className?: string;
}

export function FlowScreenWrapper({
  flowId,
  configUrl,
  actionContext = {},
  className = "",
}: FlowScreenWrapperProps) {
  const [config, setConfig] = useState<FlowConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!flowId && !configUrl) {
      setError("Flow ID or configUrl required");
      return;
    }
    // configUrl used exactly — no origin prefix, no query rewriting
    const url = configUrl ?? `/api/flows/${encodeURIComponent(flowId)}?t=${Date.now()}`;
    fetch(url, { cache: "no-store", headers: { Pragma: "no-cache" } })
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then((data) => {
        setConfig(data as FlowConfig);
        setError(null);
      })
      .catch((err) => setError(err?.message ?? "Failed to load flow"));
  }, [flowId, configUrl]);

  // Dev-only: expose FlowConfig to the dev sidebar so Nodes panel can build a flow node list.
  useEffect(() => {
    if (!config || !config.screens?.length) return;
    if (typeof window === "undefined") return;
    if (process.env.NODE_ENV === "production") return;
    if (!window.location.pathname.startsWith("/dev")) return;
    const params = new URLSearchParams(window.location.search);
    const screenPath = params.get("screen");
    if (!screenPath) return;
    const initialScreenId = config.screens[0]?.id ?? null;
    setDevFlowProps(screenPath, config, initialScreenId);
  }, [config]);

  const onAction = useCallback(
    (action: string, params: Record<string, unknown>) => {
      const context: FlowActionContext = {
        ...actionContext,
        flowId,
        domain: actionContext?.domain,
      };
      runFlowAction(action, params, context);
    },
    [flowId, actionContext]
  );

  // Hooks must run unconditionally — call before any early returns.
  if (error) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#94a3b8" }}>
        Failed to load flow: {error}
      </div>
    );
  }

  if (!config || !config.screens?.length) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#94a3b8" }}>
        Loading…
      </div>
    );
  }

  return (
    <FlowEngine
      config={config}
      onAction={onAction}
      actionContext={{ ...actionContext, flowId }}
      className={className}
    />
  );
}
