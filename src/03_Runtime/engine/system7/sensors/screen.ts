import { isSensorAllowed } from "./sensor-capability-gate";

export function readScreen(): {
  width: number;
  height: number;
  scale: number;
  available: boolean;
  error?: string;
} {
  if (!isSensorAllowed("screen")) {
    return { width: 0, height: 0, scale: 1, available: false };
  }
  try {
    if (typeof window === "undefined") {
      return {
        width: 0,
        height: 0,
        scale: 1,
        available: false,
        error: "window not available",
      };
    }
    return {
      width: window.innerWidth ?? 0,
      height: window.innerHeight ?? 0,
      scale: typeof window.devicePixelRatio === "number" ? window.devicePixelRatio : 1,
      available: true,
    };
  } catch (e) {
    return {
      width: 0,
      height: 0,
      scale: 1,
      available: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}
