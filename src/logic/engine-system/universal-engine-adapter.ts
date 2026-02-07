/**
 * Universal Engine Adapter — delegation only.
 * Single entry point that routes by type to existing subsystems.
 * No new logic. No state shape changes. No registry changes.
 */

import { applyEngine } from "@/logic/engine-system/engine-contract";
import { runCalculator } from "@/logic/actions/run-calculator.action";
import { System7Router } from "@/engine/system7/system7-router";
import runBehavior from "@/behavior/behavior-runner";

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
      const systemPayload = payload.payload ?? {};
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
