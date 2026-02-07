/**
 * System 7 engine entry — stable plug for engine contract.
 * Calls system7-router only. No state-store, layout, or sensors.
 */
"use client";

import type { System7Output } from "./system7.types";
import { System7Router } from "./system7-router";

export interface RunSystem7Input {
  channel: string;
  action: string;
  payload?: Record<string, unknown>;
}

export interface RunSystem7Context {
  flowId?: string;
}

/**
 * Run System 7 with the given input and context.
 * Does not modify state-store, layout-store, or attach sensors.
 */
export function runSystem7(input: RunSystem7Input, _context: RunSystem7Context = {}): System7Output {
  const { channel, action, payload = {} } = input;
  return System7Router.route(channel, action, payload);
}
