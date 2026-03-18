/**
 * 09_Integrations — input log (append + latest read).
 * Minimal additive module; not integrated across the app yet.
 */

import type { InputEvent } from "./input-event";

const log: InputEvent[] = [];
const MAX_LOG_SIZE = 500;

export function appendInputEvent(evt: InputEvent): void {
  log.push(evt);
  if (log.length > MAX_LOG_SIZE) {
    log.shift();
  }
}

export function getLatestRead(kind?: InputEvent["kind"]): InputEvent | null {
  if (!kind) {
    return log.length > 0 ? log[log.length - 1]! : null;
  }
  for (let i = log.length - 1; i >= 0; i--) {
    if (log[i]!.kind === kind) return log[i]!;
  }
  return null;
}

export function getLogSnapshot(): InputEvent[] {
  return [...log];
}
