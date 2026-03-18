/**
 * Shared recording engine: start/stop, duration tracking, blob output.
 * Used by useRoomRecording (live room) and RecorderModule (standalone recorder).
 */

export interface RecordingEngineResult {
  start: (stream: MediaStream, mimeType?: string) => void;
  stop: () => void;
  getBlob: () => Blob | null;
  getDurationSec: () => number;
  isRecording: () => boolean;
}

function selectMimeType(stream: MediaStream, preferred?: string): string | undefined {
  const hasVideo = stream.getVideoTracks().length > 0;
  const defaultMime = hasVideo ? "video/webm;codecs=vp9,opus" : "audio/webm;codecs=opus";
  const mime = preferred || defaultMime;
  const fallbacks = hasVideo
    ? [mime, "video/webm", "video/webm;codecs=vp8", "video/mp4"]
    : [mime, "audio/webm", "audio/mp4"];
  for (const t of fallbacks) {
    if (t && typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) {
      return t;
    }
  }
  return undefined;
}

/**
 * Create a recording engine instance. Call start(stream, mimeType?), then stop(); use getBlob() after stop and getDurationSec() during/after recording.
 */
export function createRecordingEngine(): RecordingEngineResult {
  let mediaRecorder: MediaRecorder | null = null;
  let chunks: Blob[] = [];
  let storedMimeType = "audio/webm";
  let startTimeMs: number | null = null;
  let endTimeMs: number | null = null;

  return {
    start(stream: MediaStream, mimeType?: string) {
      if (mediaRecorder?.state === "recording") return;
      chunks = [];
      endTimeMs = null;
      const selected = selectMimeType(stream, mimeType);
      const options = selected
        ? {
            mimeType: selected,
            videoBitsPerSecond: stream.getVideoTracks().length > 0 ? 2_500_000 : undefined,
          }
        : undefined;
      storedMimeType = selected ?? "audio/webm";
      startTimeMs = Date.now();
      mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      mediaRecorder.start(1000);
    },

    stop() {
      if (!mediaRecorder || mediaRecorder.state === "inactive") return;
      endTimeMs = Date.now();
      mediaRecorder.stop();
      mediaRecorder = null;
    },

    getBlob(): Blob | null {
      if (chunks.length === 0) return null;
      return new Blob(chunks, { type: storedMimeType });
    },

    getDurationSec(): number {
      if (startTimeMs == null) return 0;
      const endMs = mediaRecorder?.state === "recording" ? Date.now() : (endTimeMs ?? startTimeMs);
      return Math.floor((endMs - startTimeMs) / 1000);
    },

    isRecording(): boolean {
      return mediaRecorder?.state === "recording" ?? false;
    },
  };
}
