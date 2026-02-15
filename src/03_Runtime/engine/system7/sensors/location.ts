import { isSensorAllowed } from "./sensor-capability-gate";

export function readLocation() {
  if (!isSensorAllowed("location")) {
    return { lat: null, lon: null, accuracy: null, available: false };
  }
  return { lat: null, lon: null, accuracy: null, available: true };
}
  