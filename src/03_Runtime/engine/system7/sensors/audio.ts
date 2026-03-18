import { isSensorAllowed } from "./sensor-capability-gate";

export function readAudio(): Promise<{
  active: boolean;
  stream: MediaStream | null;
  available: boolean;
  error?: string;
}> {
  if (!isSensorAllowed("audio")) {
    return Promise.resolve({
      active: false,
      stream: null,
      available: false,
    });
  }
  try {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      return Promise.resolve({
        active: false,
        stream: null,
        available: false,
        error: "getUserMedia not supported",
      });
    }
    return navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => ({
        active: true,
        stream,
        available: true,
      }))
      .catch((err: unknown) => ({
        active: false,
        stream: null,
        available: false,
        error: err instanceof Error ? err.message : "Permission denied or error",
      }));
  } catch (e) {
    return Promise.resolve({
      active: false,
      stream: null,
      available: false,
      error: e instanceof Error ? e.message : "Unknown error",
    });
  }
}
