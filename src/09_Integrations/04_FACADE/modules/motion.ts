/**
 * Motion/Orientation — facade module.
 * Wraps existing System7 sensors; single responsibility: normalize naming + return shape.
 */

import { readOrientation as readOrientationImpl } from "@/engine/system7/sensors/orientation";
import { readMotion as readMotionImpl } from "@/engine/system7/sensors/motion";

export function readOrientation() {
  return readOrientationImpl();
}

export function readMotion() {
  return readMotionImpl();
}
