import { isSensorAllowed } from "./sensor-capability-gate";

export function readMotion() {
  if (!isSensorAllowed("motion")) {
    return { x: 0, y: 0, z: 0, available: false };
  }
  return { x: 0, y: 0, z: 0, available: true };
}
