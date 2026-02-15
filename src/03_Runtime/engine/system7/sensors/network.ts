import { isSensorAllowed } from "./sensor-capability-gate";

export function readNetwork() {
  if (!isSensorAllowed("network")) {
    return { online: true, effectiveType: null, available: false };
  }
  return {
    online: typeof navigator !== "undefined" ? navigator.onLine : true,
    effectiveType: null,
    available: true,
  };
}
