// src/logic/runtime/engine-bridge.ts
/**
 * ============================================================
 * ENGINE BRIDGE (STATE HOLDER)
 * ============================================================
 * - Single shared engine state
 * - Mutated by action handlers
 * - Read by UI
 * - NOTIFIES React on change
 * ============================================================
 */


type Listener = () => void;


const engineState: Record<string, any> = {};
const listeners = new Set<Listener>();


/**
 * READ
 */
export function readEngineState() {
  return engineState;
}


/**
 * SUBSCRIBE (REQUIRED FOR React re-render)
 */
export function subscribeEngineState(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}


/**
 * WRITE + NOTIFY
 */
export function writeEngineState(next: Record<string, any>) {
  Object.assign(engineState, next);


  // 🔥 THIS IS THE MISSING PIECE
  listeners.forEach((l) => l());
}


