import { isSensorAllowed } from "./sensor-capability-gate";

export function readLocation(): Promise<{
  lat: number | null;
  lon: number | null;
  accuracy: number | null;
  available: boolean;
  error?: string;
}> {
  if (!isSensorAllowed("location")) {
    return Promise.resolve({
      lat: null,
      lon: null,
      accuracy: null,
      available: false,
    });
  }
  try {
    if (typeof navigator === "undefined" || !navigator.geolocation?.getCurrentPosition) {
      return Promise.resolve({
        lat: null,
        lon: null,
        accuracy: null,
        available: false,
        error: "Geolocation not supported",
      });
    }
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            accuracy: pos.coords.accuracy ?? null,
            available: true,
          });
        },
        (err) => {
          resolve({
            lat: null,
            lon: null,
            accuracy: null,
            available: false,
            error: err?.message ?? "Permission denied or error",
          });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  } catch (e) {
    return Promise.resolve({
      lat: null,
      lon: null,
      accuracy: null,
      available: false,
      error: e instanceof Error ? e.message : "Unknown error",
    });
  }
}
