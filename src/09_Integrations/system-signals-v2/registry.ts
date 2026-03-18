/**
 * System Signals V2 — canonical list of system signal IDs.
 * Battery, network, device, screen only. Thermals/memory/lifecycle planned, not implemented.
 * Does not include calibrated sensors (gyro, motion, camera, audio, location).
 */

export const SYSTEM_SIGNAL_IDS = [
  "battery",
  "network",
  "device",
  "screen",
] as const;

export type SystemSignalId = (typeof SYSTEM_SIGNAL_IDS)[number];
