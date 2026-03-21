"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import FlowRuntimeScreen from "@/engine/onboarding/FlowRuntimeScreen";
import type { FlowRuntimeScreenProps } from "@/engine/onboarding/FlowRuntimeScreen";
import Page from "@/app/page";

function DevPageContent() {
  const params = useSearchParams();

  const screen = params.get("screen");
  const flowId = params.get("flowId");
  const configUrl = params.get("configUrl");

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

  // For all standard /dev?screen=... paths, use the same renderer pipeline as root page.
  return <Page />;
}

export default function DevPage() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <DevPageContent />
    </Suspense>
  );
}
