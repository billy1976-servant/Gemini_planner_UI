import { isSensorAllowed } from "./sensor-capability-gate";

export function readScreen() {
  if (!isSensorAllowed("screen")) {
    return { width: 0, height: 0, scale: 1, available: false };
  }
  if (typeof window !== "undefined" && window.screen) {
    return {
      width: window.screen.width,
      height: window.screen.height,
      scale: typeof window.devicePixelRatio === "number" ? window.devicePixelRatio : 1,
      available: true,
    };
  }
  return { width: 0, height: 0, scale: 1, available: true };
}
