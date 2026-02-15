/**
 * Camera — facade module.
 * Wraps existing System7 camera sensor (getUserMedia video).
 * No stub needed; existing implementation is used.
 */

import { readCamera as readCameraImpl } from "@/engine/system7/sensors/camera";

export function readCamera() {
  return readCameraImpl();
}

/** Alias for facade API: capture/stream; same as readCamera. */
export function capturePhotoStubOrExisting() {
  return readCameraImpl();
}
