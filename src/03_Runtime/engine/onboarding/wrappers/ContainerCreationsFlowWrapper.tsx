"use client";

/**
 * Container Creations — onboarding flow wrapper (runtime layer).
 * No engine logic: delegates to FlowScreenWrapper; config from JSON only.
 * Version comes from domain routing (section + versionNumber) so TSX and JSON stay aligned.
 */

import React from "react";
import { FlowScreenWrapper } from "@/engine/onboarding/flow-engine";

const CONFIG_URL = "/api/container-creations-landing-config";

export interface ContainerCreationsFlowWrapperProps {
  /** From domain router: first path segment (e.g. onboarding). */
  section?: string;
  /** From domain router: parsed version (e.g. 2 → load v2 JSON). Keeps TSX and JSON in sync. */
  versionNumber?: number | null;
  slug?: string[];
}

export default function ContainerCreationsFlowWrapper({
  section,
  versionNumber,
  slug,
}: ContainerCreationsFlowWrapperProps = {}) {
  const configUrl =
    versionNumber != null
      ? `${CONFIG_URL}?variant=v${versionNumber}`
      : CONFIG_URL;
  return (
    <FlowScreenWrapper
      flowId="container-creations-landing-5"
      configUrl={configUrl}
      actionContext={{}}
      className="container-creations-flow"
    />
  );
}
