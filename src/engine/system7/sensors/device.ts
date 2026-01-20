export function readDevice() {
    return {
      platform: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
      battery: null,
      orientation: "portrait"
    };
  }
  