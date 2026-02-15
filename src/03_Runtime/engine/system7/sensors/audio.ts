import { isSensorAllowed } from "./sensor-capability-gate";

export function readAudio() {
  if (!isSensorAllowed("audio")) {
    return { active: false, amplitude: 0, available: false };
  }
  return { active: false, amplitude: 0, available: true };
}
