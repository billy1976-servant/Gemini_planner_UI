import { isSensorAllowed } from "./sensor-capability-gate";

let orientationListenerAttached = false;
let lastOrientation: { alpha: number; beta: number; gamma: number } = {
  alpha: 0,
  beta: 0,
  gamma: 0,
};

function attachOrientationListener(): void {
  if (orientationListenerAttached || typeof window === "undefined") return;
  try {
    window.addEventListener(
      "deviceorientation",
      (ev) => {
        lastOrientation = {
          alpha: typeof ev.alpha === "number" ? ev.alpha : 0,
          beta: typeof ev.beta === "number" ? ev.beta : 0,
          gamma: typeof ev.gamma === "number" ? ev.gamma : 0,
        };
      },
      { passive: true }
    );
    orientationListenerAttached = true;
  } catch {
    orientationListenerAttached = true;
  }
}

export function readOrientation(): {
  alpha: number;
  beta: number;
  gamma: number;
  available: boolean;
  error?: string;
} {
  if (!isSensorAllowed("orientation")) {
    return { alpha: 0, beta: 0, gamma: 0, available: false };
  }
  try {
    if (typeof window === "undefined") {
      return {
        alpha: 0,
        beta: 0,
        gamma: 0,
        available: false,
        error: "window not available",
      };
    }
    attachOrientationListener();
    return {
      alpha: lastOrientation.alpha,
      beta: lastOrientation.beta,
      gamma: lastOrientation.gamma,
      available: true,
    };
  } catch (e) {
    return {
      alpha: 0,
      beta: 0,
      gamma: 0,
      available: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}
