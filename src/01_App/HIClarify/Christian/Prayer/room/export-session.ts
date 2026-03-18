/**
 * Export session: video recording + slide deck + annotation timeline JSON.
 * Outputs a JSON manifest and optionally a ZIP containing the recording + manifest.
 */

import type { StudyDeck } from "../study/StudySlide";
import type { SessionEvent } from "./session-timeline";
import type { AnnotationEvent } from "./annotation-timeline";

export interface ExportedSessionManifest {
  version: 1;
  exportedAt: string;
  recording: {
    mimeType: string;
    /** Size in bytes (or 0 if not included in this export). */
    sizeBytes: number;
  };
  deck: StudyDeck | null;
  sessionTimeline: SessionEvent[];
  annotationTimeline: AnnotationEvent[];
  durationSec: number;
}

/**
 * Build the session manifest (JSON-serializable).
 * Caller can save recording blob separately or include in ZIP.
 */
export function buildSessionManifest(
  recordedBlob: Blob | null,
  deck: StudyDeck | null,
  sessionTimeline: SessionEvent[],
  annotationTimeline: AnnotationEvent[],
  durationSec: number
): ExportedSessionManifest {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    recording: {
      mimeType: recordedBlob?.type ?? "audio/webm",
      sizeBytes: recordedBlob?.size ?? 0,
    },
    deck,
    sessionTimeline,
    annotationTimeline,
    durationSec,
  };
}

/**
 * Download manifest as JSON file.
 */
export function downloadSessionManifest(manifest: ExportedSessionManifest, filenameBase: string): void {
  const json = JSON.stringify(manifest, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filenameBase}-session.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Download recording blob as file (e.g. recording.webm).
 */
export function downloadRecordingBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Export session as JSON manifest + separate recording file (MP4/WebM).
 * Optionally triggers download of both.
 */
export function exportSession(
  recordedBlob: Blob | null,
  deck: StudyDeck | null,
  sessionTimeline: SessionEvent[],
  annotationTimeline: AnnotationEvent[],
  durationSec: number,
  options?: { downloadRecording?: boolean; downloadManifest?: boolean; filenameBase?: string }
): ExportedSessionManifest {
  const manifest = buildSessionManifest(
    recordedBlob,
    deck,
    sessionTimeline,
    annotationTimeline,
    durationSec
  );
  const base = options?.filenameBase ?? "prayer-session";
  if (options?.downloadManifest !== false) {
    downloadSessionManifest(manifest, base);
  }
  if (options?.downloadRecording !== false && recordedBlob) {
    const ext = recordedBlob.type.includes("video") ? "webm" : "webm";
    downloadRecordingBlob(recordedBlob, `${base}-recording.${ext}`);
  }
  return manifest;
}
