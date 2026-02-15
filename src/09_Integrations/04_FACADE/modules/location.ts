/**
 * Location — facade module.
 * Wraps existing System7 location sensor.
 */

import { readLocation as readLocationImpl } from "@/engine/system7/sensors/location";

export function readLocation() {
  return readLocationImpl();
}
