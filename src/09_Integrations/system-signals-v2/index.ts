/**
 * System Signals V2 — entry point.
 * Wraps existing capture → input-log → interpret pipeline for system signals only.
 * No calibrated sensors (gyro, motion, camera, audio, location).
 */

export { SYSTEM_SIGNAL_IDS, type SystemSignalId } from "./registry";
export { getSystemSnapshot } from "./snapshot";
