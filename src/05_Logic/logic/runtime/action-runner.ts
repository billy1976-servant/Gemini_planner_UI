// src/logic/runtime/action-runner.ts

import { getActionHandler } from "@/logic/engine-system/engine-contract";
import { getCapabilityLevel } from "@/03_Runtime/capability/capability-store";
import {
  CAPABILITY_ACTION_MAP,
  CAPABILITY_ACTION_PREFIXES,
  type ActionCapabilityRule,
} from "@/03_Runtime/capability/capability-action-map";

function getRuleForAction(actionName: string): ActionCapabilityRule | undefined {
  const exact = CAPABILITY_ACTION_MAP[actionName];
  if (exact) return exact;
  let matched: ActionCapabilityRule | undefined;
  let maxLen = 0;
  for (const { prefix, domain } of CAPABILITY_ACTION_PREFIXES) {
    if (actionName.startsWith(prefix) && prefix.length > maxLen) {
      maxLen = prefix.length;
      matched = { domain };
    }
  }
  return matched;
}

/**
 * ACTION RUNNER
 * ------------------------------------------------------------
 * - Single responsibility: route an action to its handler
 * - Capability gating: if action is in CAPABILITY_ACTION_MAP (or matches a prefix) and required capability is off, skip handler
 * - NO logic beyond gating
 * - REQUIRED return for pipeline continuity
 * ------------------------------------------------------------
 */

function isActionAllowedByCapability(actionName: string): boolean {
  const rule = getRuleForAction(actionName);
  if (!rule) return true;
  const level = getCapabilityLevel(rule.domain);
  const levelStr = typeof level === "string" ? level : (level as Record<string, string>)?.level ?? "off";
  if (levelStr === "off") return false;
  if (rule.minLevel && levelStr !== rule.minLevel) {
    const order = ["off", "basic", "advanced", "lite", "full", "on"];
    const levelIdx = order.indexOf(levelStr);
    const minIdx = order.indexOf(rule.minLevel);
    if (levelIdx >= 0 && minIdx >= 0 && levelIdx < minIdx) return false;
  }
  return true;
}

export function runAction(action: any, state: Record<string, any>) {
  if (!action || typeof action.name !== "string") {
    console.error("[action-runner] Invalid action:", action);
    return state;
  }

  if (!isActionAllowedByCapability(action.name)) {
    return state;
  }

  const handler = getActionHandler(action.name);

  if (!handler) {
    console.error("[action-runner] No handler for action:", action.name);
    return state;
  }

  try {
    handler(action, state);
  } catch (err) {
    console.error(
      "[action-runner] Handler threw for action:",
      action.name,
      err
    );
  }

  // 🔑 CRITICAL:
  // Always return state so the verb pipeline never breaks
  return state;
}


