import { isSensorAllowed } from "./sensor-capability-gate";

export function readNetwork(): {
  online: boolean;
  effectiveType: string | null;
  available: boolean;
  error?: string;
} {
  if (!isSensorAllowed("network")) {
    return { online: true, effectiveType: null, available: false };
  }
  try {
    if (typeof navigator === "undefined") {
      return {
        online: true,
        effectiveType: null,
        available: false,
        error: "navigator not available",
      };
    }
    const conn = (navigator as Navigator & { connection?: { effectiveType?: string } }).connection;
    const effectiveType = conn?.effectiveType ?? null;
    return {
      online: navigator.onLine,
      effectiveType: effectiveType ?? null,
      available: true,
    };
  } catch (e) {
    return {
      online: true,
      effectiveType: null,
      available: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}
