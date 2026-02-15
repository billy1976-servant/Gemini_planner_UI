import { isSensorAllowed } from "./sensor-capability-gate";

export function readBattery() {
  if (!isSensorAllowed("battery")) {
    return { level: null, charging: false, available: false };
  }
  return { level: null, charging: false, available: true };
}
