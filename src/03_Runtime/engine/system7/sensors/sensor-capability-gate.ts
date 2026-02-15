/**
 * Sensor capability gate — reads capability store to determine which sensors are allowed.
 * camera: on → camera allowed
 * sensors: lite → device, screen, location only
 * sensors: full → device, screen, location, camera, audio
 * sensors: off → none (device/screen may still be allowed for minimal context; gate strictly by sensors + camera)
 */

import { getCapabilityLevel } from "@/03_Runtime/capability";

export type SensorId =
  | "camera"
  | "device"
  | "screen"
  | "location"
  | "audio"
  | "motion"
  | "orientation"
  | "battery"
  | "network";

const LITE_SENSORS: SensorId[] = ["device", "screen", "location"];
const FULL_SENSORS: SensorId[] = [
  "device",
  "screen",
  "location",
  "camera",
  "audio",
  "motion",
  "orientation",
  "battery",
  "network",
];

function parseSensorsLevel(level: string | Record<string, unknown>): "off" | "lite" | "full" {
  const s = typeof level === "string" ? level : (level as Record<string, string>)?.level ?? "off";
  if (s === "full") return "full";
  if (s === "lite") return "lite";
  return "off";
}

/**
 * Returns true if the sensor is allowed by current capability profile.
 */
export function isSensorAllowed(sensorId: SensorId): boolean {
  if (sensorId === "camera") {
    const cameraLevel = getCapabilityLevel("camera");
    const cam = typeof cameraLevel === "string" ? cameraLevel : (cameraLevel as Record<string, string>)?.level ?? "off";
    return cam !== "off";
  }
  const sensorsLevel = getCapabilityLevel("sensors");
  const sens = parseSensorsLevel(sensorsLevel);
  if (sens === "off") return false;
  if (sens === "lite") return LITE_SENSORS.includes(sensorId);
  return FULL_SENSORS.includes(sensorId);
}
