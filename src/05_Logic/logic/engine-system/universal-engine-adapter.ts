/**
 * Universal Engine Adapter — delegation only.
 * Single entry point that routes by type to existing subsystems.
 * Capability gating: when type is "system", the requested channel is gated by capability; if off, return no-op.
 */

import { applyEngine } from "@/logic/engine-system/engine-contract";
import { runCalculator } from "@/logic/actions/run-calculator.action";
import { System7Router } from "@/engine/system7/system7-router";
import runBehavior from "@/behavior/behavior-runner";
import { isCapabilityOn } from "@/03_Runtime/capability";
import type { CapabilityDomain } from "@/03_Runtime/capability";
import { getIdentityPayload } from "@/engine/system7/identity-auth-bridge";
import { getEnvironmentPayload } from "@/engine/system7/environment-bridge";
import { getMediaPayload } from "@/engine/system7/media-payload-bridge";

export type UniversalEngineType = "flow" | "calculator" | "system" | "behavior";

export interface UniversalEngineContext {
  state?: Record<string, any>;
  flow?: any;
  ctx?: any;
}

export interface ApplyUniversalEngineParams {
  engineId: string;
  type: UniversalEngineType;
  payload: Record<string, any>;
  context?: UniversalEngineContext;
}

/**
 * Apply an engine by id and type. Delegates to existing subsystems only.
 */
export function applyUniversalEngine({
  engineId,
  type,
  payload,
  context = {},
}: ApplyUniversalEngineParams): any {
  const { state = {}, flow, ctx } = context;

  switch (type) {
    case "flow": {
      const flowInput = payload.flow ?? flow;
      if (!flowInput) return undefined;
      return applyEngine(flowInput, engineId as any);
    }

    case "calculator": {
      const action = {
        calculatorId: payload.calculatorId,
        inputKey: payload.inputKey,
        outputKey: payload.outputKey,
      };
      runCalculator(action, state);
      return undefined;
    }

    case "system": {
      const channel = payload.channel ?? "identity";
      const action = payload.action ?? "";
      let systemPayload = payload.payload ?? {};
      const channelToDomain: Record<string, CapabilityDomain> = {
        identity: "auth",
        media: "media",
        environment: "sensors",
        parameters: "device",
        timeline: "timeline",
        content: "export",
        style: "device",
      };
      const domain = channelToDomain[channel];
      let allowed = true;
      if (domain) {
        if (channel === "media") {
          allowed = isCapabilityOn("media") || isCapabilityOn("camera");
        } else {
          allowed = isCapabilityOn(domain);
        }
      }
      if (!allowed) {
        return {
          kind: "system7",
          channels: {
            [channel]: {
              kind: "semantic",
              channel,
              data: {},
              children: [],
            },
          },
        };
      }
      if (channel === "identity" && domain === "auth") {
        const identity = getIdentityPayload();
        systemPayload = { ...systemPayload, userId: identity.userId, name: identity.name, role: identity.role };
      }
      if (channel === "environment" && domain === "sensors") {
        const environment = getEnvironmentPayload();
        systemPayload = { ...systemPayload, ...environment };
      }
      if (channel === "media" && (domain === "media" || domain === "camera")) {
        const media = getMediaPayload();
        if (Object.keys(media).length > 0) systemPayload = { ...systemPayload, ...media };
      }
      return System7Router.route(channel, action, systemPayload);
    }

    case "behavior": {
      const domain = payload.domain ?? "";
      const action = payload.action ?? "";
      const args = payload.args ?? {};
      return runBehavior(domain, action, ctx ?? {}, args);
    }

    default:
      return undefined;
  }
}
