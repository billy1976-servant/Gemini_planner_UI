"use client";

/**
 * Universal JSON flow runtime screen.
 * Loads any onboarding flow by flowId and configUrl (from props or URL search params).
 * Renders FlowScreenWrapper → FlowEngine; no per-business TSX needed.
 */

import React, { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { FlowScreenWrapper } from "@/engine/onboarding/flow-engine";

export interface FlowRuntimeScreenProps {
  flowId?: string;
  configUrl?: string;
}

function FlowRuntimeScreenInner(props: FlowRuntimeScreenProps) {
  const searchParams = useSearchParams();
  const flowIdFromProps = props.flowId;
  const configUrlFromProps = props.configUrl;

  let flowId = flowIdFromProps ?? searchParams.get("flowId");
  let configUrl = configUrlFromProps ?? searchParams.get("configUrl") ?? undefined;
  if (flowId == null && typeof window !== "undefined") {
    const p = new URLSearchParams(window.location.search);
    flowId = flowId ?? p.get("flowId");
    configUrl = configUrl ?? p.get("configUrl") ?? undefined;
  }

  useEffect(() => {
    if (typeof console !== "undefined" && console.log) {
      console.log("FLOW RUNTIME MOUNTED", { flowId, configUrl });
    }
  }, [flowId, configUrl]);

  // configUrl is required when screen is FlowRuntimeScreen (dev passes it)
  if (!configUrl) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-secondary, #64748b)" }}>
        configUrl required
      </div>
    );
  }

  return (
    <FlowScreenWrapper
      flowId={flowId ?? ""}
      configUrl={configUrl}
      actionContext={{}}
      className="flow-runtime-screen"
    />
  );
}

const FlowRuntimeScreen: React.FC<FlowRuntimeScreenProps> = FlowRuntimeScreenInner;
export default FlowRuntimeScreen;
