/**
 * 09_Integrations — fireTrigger → gate → read → append.
 * Minimal spine: gate check, then call facade read, then append to input-log.
 * Not integrated across the app yet; IntegrationLab can optionally use this to prove pipeline.
 */

import { Integrations } from "./04_FACADE/integrations";
import type { SensorId } from "./04_FACADE/integrations";
import { createInputEvent, type InputEvent } from "./input-event";
import { appendInputEvent } from "./input-log";

const SENSOR_TO_KIND: Record<SensorId, InputEvent["kind"]> = {
  camera: "camera",
  device: "device",
  screen: "screen",
  location: "location",
  motion: "motion",
  orientation: "orientation",
  battery: "battery",
  network: "network",
  audio: "audio",
};

function readSensor(sensorId: SensorId): Promise<Record<string, unknown>> | Record<string, unknown> {
  switch (sensorId) {
    case "orientation":
      return Integrations.motion.readOrientation();
    case "motion":
      return Integrations.motion.readMotion();
    case "location":
      return Integrations.location.readLocation();
    case "camera":
      return Integrations.camera.readCamera();
    case "audio":
      return Integrations.audio.readAudio();
    case "battery":
      return Integrations.device.readBattery();
    case "network":
      return Integrations.device.readNetwork();
    case "device":
      return Integrations.device.readDevice();
    case "screen":
      return Integrations.device.readScreen();
    default:
      return { available: false, error: "Unknown sensor" };
  }
}

/**
 * Fire a capture for one sensor: gate → read → append to log.
 * Returns the payload (or resolved promise) for optional "Show Latest" in lab.
 * @param meta.triggerId - Optional label for the trigger (e.g. 'lab_button').
 */
export function fireTrigger(
  sensorId: SensorId,
  meta?: { triggerId?: string }
): Promise<Record<string, unknown>> {
  const allowed = Integrations.gates.isSensorAllowed(sensorId);
  const triggerId = meta?.triggerId ?? undefined;
  if (!allowed) {
    return Promise.resolve({
      allowed: false,
      value: null,
      message: "DISALLOWED",
    });
  }
  const result = readSensor(sensorId);
  const promise =
    result && typeof (result as Promise<unknown>).then === "function"
      ? (result as Promise<Record<string, unknown>>)
      : Promise.resolve(result as Record<string, unknown>);
  return promise
    .then((payload) => {
      const evt = createInputEvent(
        SENSOR_TO_KIND[sensorId] ?? "device",
        { allowed: true, value: payload, triggerId },
        "09_Integrations/capture"
      );
      appendInputEvent(evt);
      return { allowed: true, value: payload };
    })
    .catch((err) => {
      const errorMessage = err instanceof Error ? err.message : String(err);
      return {
        allowed: true,
        value: null,
        error: errorMessage,
      };
    });
}
