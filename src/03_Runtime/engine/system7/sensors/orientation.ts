import { isSensorAllowed } from "./sensor-capability-gate";

export function readOrientation() {
  if (!isSensorAllowed("orientation")) {
    return { alpha: 0, beta: 0, gamma: 0, available: false };
  }
  return { alpha: 0, beta: 0, gamma: 0, available: true };
}
