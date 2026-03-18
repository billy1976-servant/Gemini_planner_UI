import { isSensorAllowed } from "./sensor-capability-gate";

export function readBattery(): Promise<{
  level: number | null;
  charging: boolean;
  available: boolean;
  error?: string;
}> {
  if (!isSensorAllowed("battery")) {
    return Promise.resolve({
      level: null,
      charging: false,
      available: false,
    });
  }
  try {
    const nav = typeof navigator !== "undefined" ? navigator : undefined;
    interface BatteryLike {
      level: number;
      charging: boolean;
    }
    const getBat = (nav as Navigator & { getBattery?: () => Promise<BatteryLike> })?.getBattery;
    if (!getBat) {
      return Promise.resolve({
        level: null,
        charging: false,
        available: false,
        error: "Battery API not supported",
      });
    }
    return getBat
      .call(navigator)
      .then((b) => ({
        level: typeof b.level === "number" ? b.level : null,
        charging: Boolean(b.charging),
        available: true,
      }))
      .catch((err: unknown) => ({
        level: null,
        charging: false,
        available: false,
        error: err instanceof Error ? err.message : "Battery API error",
      }));
  } catch (e) {
    return Promise.resolve({
      level: null,
      charging: false,
      available: false,
      error: e instanceof Error ? e.message : "Unknown error",
    });
  }
}
