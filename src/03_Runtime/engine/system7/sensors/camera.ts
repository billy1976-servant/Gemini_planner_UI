import { isSensorAllowed } from "./sensor-capability-gate";

export function readCamera() {
  if (!isSensorAllowed("camera")) {
    return { active: false, lastCapture: null, available: false };
  }
  return { active: false, lastCapture: null, available: true };
}
