import { isSensorAllowed } from "./sensor-capability-gate";

export function readDevice() {
  if (!isSensorAllowed("device")) {
    return { platform: "unknown", battery: null, orientation: "portrait", available: false };
  }
  return {
    platform: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
    battery: null,
    orientation: "portrait",
    available: true,
  };
}
  