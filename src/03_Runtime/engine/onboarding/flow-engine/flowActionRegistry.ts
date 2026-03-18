/**
 * Registry for flow step actions. Action names are generic (e.g. navigate, openRoom, showReplay).
 * Domain-specific logic lives only in wrappers (e.g. PrayerFlowWrapper); runFlowAction(action, params, context)
 * does not depend on Prayer or any app internals. Wrappers register handlers that interpret actions.
 */

import type { FlowActionContext, FlowActionHandler } from "./types";

const registry = new Map<string, FlowActionHandler>();

export function registerFlowAction(action: string, handler: FlowActionHandler): void {
  registry.set(action, handler);
}

export function unregisterFlowAction(action: string): void {
  registry.delete(action);
}

export function getFlowActionHandler(action: string): FlowActionHandler | undefined {
  return registry.get(action);
}

/**
 * Execute an action by name. No-op if not registered.
 */
export function runFlowAction(
  action: string,
  params: Record<string, unknown>,
  context: FlowActionContext
): void | Promise<void> {
  const handler = registry.get(action);
  if (!handler) return;
  return handler(params, context);
}
