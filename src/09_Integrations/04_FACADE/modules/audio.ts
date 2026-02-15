/**
 * Audio — facade module.
 * Wraps existing System7 audio sensor (getUserMedia audio).
 * readMicLevel: stub when no level meter exists; does not crash.
 */

import { readAudio as readAudioImpl } from "@/engine/system7/sensors/audio";

export function readAudio() {
  return readAudioImpl();
}

/** Stub: mic level not wired yet; returns safe shape, no crash. */
export function readMicLevelStubOrExisting(): {
  level: number | null;
  available: boolean;
  error?: string;
} {
  try {
    return { level: null, available: false, error: "not wired" };
  } catch {
    return { level: null, available: false, error: "not wired" };
  }
}
