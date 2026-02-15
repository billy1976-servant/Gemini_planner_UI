/**
 * Gates — facade module.
 * Sensor capability gate: is sensor allowed by current capability profile.
 */

import {
  isSensorAllowed as isSensorAllowedImpl,
  type SensorId,
} from "@/engine/system7/sensors/sensor-capability-gate";

export type { SensorId };

export function isSensorAllowed(sensorId: SensorId): boolean {
  return isSensorAllowedImpl(sensorId);
}
