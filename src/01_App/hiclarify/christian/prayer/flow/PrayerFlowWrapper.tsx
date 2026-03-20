"use client";

/**
 * Prayer domain wrapper for the Flow Engine. Registers flow actions (openPrayerRoom, navigate, showReplay)
 * and renders FlowScreenWrapper with prayer base path. Flow screens run under TSXScreenWithEnvelope
 * when rendered from PrayerApp. Room and session/recording/replay engines are unchanged.
 */

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FlowScreenWrapper } from "@/engine/onboarding/flow-engine";
import { registerFlowAction, unregisterFlowAction } from "@/engine/onboarding/flow-engine/flowActionRegistry";

const PRAYER_ACTIONS = ["openPrayerRoom", "navigate", "showReplay"] as const;

export interface PrayerFlowWrapperProps {
  /** Flow id (e.g. prayer-onboarding). Config loaded from configUrl or /api/flows/[flowId]. */
  flowId?: string;
  /** Base path for prayer app (e.g. /prayer, /christian/prayer). */
  prayerBase?: string;
  /** Optional: use this URL to load flow config (e.g. /api/prayer-flow-config). */
  configUrl?: string;
  /** Optional domain context for actions (e.g. groupSlug). */
  domain?: Record<string, unknown>;
  className?: string;
}

export function PrayerFlowWrapper({
  flowId = "prayer-onboarding",
  prayerBase = "/prayer",
  configUrl,
  domain = {},
  className = "",
}: PrayerFlowWrapperProps) {
  const router = useRouter();

  useEffect(() => {
    registerFlowAction("openPrayerRoom", (params, context) => {
      const base = (context.basePath as string) ?? prayerBase;
      const roomId = params.roomId as string | undefined;
      if (roomId) {
        router.push(`${base}/room/${roomId}`);
      } else {
        router.push(`${base}/live`);
      }
    });

    registerFlowAction("navigate", (params, context) => {
      const path = params.path as string | undefined;
      const base = (context.basePath as string) ?? prayerBase;
      if (path) {
        const full = path.startsWith("/") ? path : `${base}/${path}`;
        router.push(full);
      } else {
        router.push(base);
      }
    });

    registerFlowAction("showReplay", (_params, context) => {
      const base = (context.basePath as string) ?? prayerBase;
      router.push(base);
    });

    return () => {
      PRAYER_ACTIONS.forEach((a) => unregisterFlowAction(a));
    };
  }, [router, prayerBase]);

  const actionContext = {
    basePath: prayerBase,
    flowId,
    domain,
  };

  return (
    <FlowScreenWrapper
      flowId={flowId}
      configUrl={configUrl}
      actionContext={actionContext}
      className={className}
    />
  );
}
