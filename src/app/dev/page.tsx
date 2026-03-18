"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import FlowRuntimeScreen from "@/engine/onboarding/FlowRuntimeScreen";
import type { FlowRuntimeScreenProps } from "@/engine/onboarding/FlowRuntimeScreen";

function DevPageContent() {
  const params = useSearchParams();

  const screen = params.get("screen");
  const flowId = params.get("flowId");
  const configUrl = params.get("configUrl");

  console.log("DEV PARAMS:", { screen, flowId, configUrl });

  // 🔥 CRITICAL: direct override
  if (screen === "tsx:Runtime/FlowRuntimeScreen") {
    if (!configUrl) {
      return <div>Missing configUrl</div>;
    }

    const flowProps: FlowRuntimeScreenProps = {
      flowId: flowId ?? "",
      configUrl,
    };
    return <FlowRuntimeScreen {...flowProps} />;
  }

  // fallback ONLY if no screen param
  return <div>Dev Navigator</div>;
}

export default function DevPage() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <DevPageContent />
    </Suspense>
  );
}
