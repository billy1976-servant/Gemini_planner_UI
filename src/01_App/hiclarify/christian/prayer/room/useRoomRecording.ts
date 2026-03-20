"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createRecordingEngine } from "./recording-engine";

export type RecordingStatus = "idle" | "recording" | "stopped";

export interface UseRoomRecordingResult {
  recordingStatus: RecordingStatus;
  recordedBlob: Blob | null;
  recordDurationSec: number;
  start: () => void;
  stop: () => void;
  clear: () => void;
}

/**
 * Builds the stream to record: audio from mixedStream, and video from screenShareStream when present.
 * When screen share is active, recording includes both so playback can show video.
 */
function getStreamToRecord(
  mixedStream: MediaStream | null,
  screenShareStream: MediaStream | null
): MediaStream | null {
  if (!mixedStream) return null;
  const videoTracks = screenShareStream?.getVideoTracks() ?? [];
  if (videoTracks.length === 0) return mixedStream;
  const combined = new MediaStream([
    ...mixedStream.getAudioTracks(),
    ...videoTracks,
  ]);
  return combined;
}

export function useRoomRecording(
  mixedStream: MediaStream | null,
  screenShareStream?: MediaStream | null
): UseRoomRecordingResult {
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>("idle");
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordDurationSec, setRecordDurationSec] = useState(0);

  const engineRef = useRef<ReturnType<typeof createRecordingEngine> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  if (!engineRef.current) {
    engineRef.current = createRecordingEngine();
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const start = useCallback(() => {
    const streamToRecord = getStreamToRecord(mixedStream, screenShareStream ?? null);
    if (!streamToRecord || recordingStatus === "recording") return;
    const engine = engineRef.current!;
    engine.start(streamToRecord);
    setRecordingStatus("recording");
    setRecordedBlob(null);
    setRecordDurationSec(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setRecordDurationSec(engine.getDurationSec());
    }, 1000);
  }, [mixedStream, screenShareStream, recordingStatus]);

  const stop = useCallback(() => {
    if (recordingStatus !== "recording") return;
    const engine = engineRef.current!;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    engine.stop();
    setRecordDurationSec(engine.getDurationSec());
    setRecordedBlob(engine.getBlob());
    setRecordingStatus("stopped");
  }, [recordingStatus]);

  const clear = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setRecordingStatus("idle");
    setRecordedBlob(null);
    setRecordDurationSec(0);
  }, []);

  return {
    recordingStatus,
    recordedBlob,
    recordDurationSec,
    start,
    stop,
    clear,
  };
}
