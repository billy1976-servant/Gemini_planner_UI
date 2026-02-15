import { isSensorAllowed } from "./sensor-capability-gate";

export function readDevice(): {
  platform: string;
  userAgent: string;
  available: boolean;
  error?: string;
} {
  if (!isSensorAllowed("device")) {
    return { platform: "unknown", userAgent: "", available: false };
  }
  try {
    if (typeof navigator === "undefined") {
      return {
        platform: "unknown",
        userAgent: "",
        available: false,
        error: "navigator not available",
      };
    }
    return {
      platform: navigator.platform ?? "unknown",
      userAgent: navigator.userAgent ?? "",
      available: true,
    };
  } catch (e) {
    return {
      platform: "unknown",
      userAgent: "",
      available: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}
