import { isSensorAllowed } from "./sensor-capability-gate";

let motionListenerAttached = false;
let lastMotion: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 };

function attachMotionListener(): void {
  if (motionListenerAttached || typeof window === "undefined") return;
  try {
    window.addEventListener(
      "devicemotion",
      (ev) => {
        const acc = ev.accelerationIncludingGravity ?? ev.acceleration;
        if (acc) {
          lastMotion = {
            x: typeof acc.x === "number" ? acc.x : 0,
            y: typeof acc.y === "number" ? acc.y : 0,
            z: typeof acc.z === "number" ? acc.z : 0,
          };
        }
      },
      { passive: true }
    );
    motionListenerAttached = true;
  } catch {
    motionListenerAttached = true;
  }
}

export function readMotion(): {
  x: number;
  y: number;
  z: number;
  available: boolean;
  error?: string;
} {
  if (!isSensorAllowed("motion")) {
    return { x: 0, y: 0, z: 0, available: false };
  }
  try {
    if (typeof window === "undefined") {
      return { x: 0, y: 0, z: 0, available: false, error: "window not available" };
    }
    attachMotionListener();
    return {
      x: lastMotion.x,
      y: lastMotion.y,
      z: lastMotion.z,
      available: true,
    };
  } catch (e) {
    return {
      x: 0,
      y: 0,
      z: 0,
      available: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}
