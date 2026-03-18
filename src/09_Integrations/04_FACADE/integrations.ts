/**
 * 09_Integrations — single import surface for device capabilities.
 * All device hooks go through this facade. Wrappers call existing implementations.
 */

import * as motionModule from "./modules/motion";
import * as locationModule from "./modules/location";
import * as cameraModule from "./modules/camera";
import * as audioModule from "./modules/audio";
import * as deviceModule from "./modules/device";
import * as gatesModule from "./modules/gates";

export type IntegrationId =
  | "orientation"
  | "motion"
  | "location"
  | "camera"
  | "audio"
  | "battery"
  | "network"
  | "device"
  | "screen"
  | "thermals"
  | "gate";

export const Integrations = {
  motion: {
    readMotion: motionModule.readMotion,
    readOrientation: motionModule.readOrientation,
  },
  location: {
    readLocation: locationModule.readLocation,
  },
  camera: {
    readCamera: cameraModule.readCamera,
    capturePhotoStubOrExisting: cameraModule.capturePhotoStubOrExisting,
  },
  audio: {
    readAudio: audioModule.readAudio,
    readMicLevelStubOrExisting: audioModule.readMicLevelStubOrExisting,
  },
  device: {
    readBattery: deviceModule.readBattery,
    readThermalsIfAny: deviceModule.readThermalsIfAny,
    readNetworkIfAny: deviceModule.readNetworkIfAny,
    readNetwork: deviceModule.readNetwork,
    readScreen: deviceModule.readScreen,
    readDevice: deviceModule.readDevice,
  },
  gates: {
    isSensorAllowed: gatesModule.isSensorAllowed,
  },
} as const;

/** Canonical sensor id union for capture/interpret pipeline. Matches 03_MANIFEST.json and system7 gate. */
export type { SensorId } from "./modules/gates";
