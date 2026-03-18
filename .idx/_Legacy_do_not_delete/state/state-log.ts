// src/state/state-log.ts
import { StateEvent } from "./state";


const log: StateEvent[] = [];


/** append-only */
export function appendEvent(
  intent: string,
  payload?: any
): StateEvent {
  const evt: StateEvent = {
    id: crypto.randomUUID(),
    time: Date.now(),
    intent,
    payload,
  };
  log.push(evt);
  return evt;
}


/** read */
export function getLog(): StateEvent[] {
  return log;
}


/** replace (used ONLY by persistence) */
export function replaceLog(events: StateEvent[]) {
  log.length = 0;
  log.push(...events);
}


/** dev only */
export function clearLog() {
  log.length = 0;
}


