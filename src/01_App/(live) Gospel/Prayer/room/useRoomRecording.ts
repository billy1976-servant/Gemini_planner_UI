"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PrayerRoomRecorder } from "./PrayerRoomRecorder";

export type RecordingStatus = "idle" | "recording" | "stopped";

export interface UseRoomRecordingResult {
  recordingStatus: RecordingStatus;
  recordedBlob: Blob | null;
  recordDurationSec: number;
  start: () => void;
  stop: () => void;
  clear: () => void;
}

export function useRoomRecording(mixedStream: MediaStream | null): UseRoomRecordingResult {
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>("idle");
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordDurationSec, setRecordDurationSec] = useState(0);

  const recorderRef = useRef<PrayerRoomRecorder | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  if (!recorderRef.current) {
    recorderRef.current = new PrayerRoomRecorder();
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const start = useCallback(() => {
    if (!mixedStream || recordingStatus === "recording") return;
    const recorder = recorderRef.current!;
    recorder.start(mixedStream);
    setRecordingStatus("recording");
    setRecordedBlob(null);
    setRecordDurationSec(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setRecordDurationSec((s) => s + 1);
    }, 1000);
  }, [mixedStream, recordingStatus]);

  const stop = useCallback(() => {
    if (recordingStatus !== "recording") return;
    const recorder = recorderRef.current!;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    recorder.stop();
    const blob = recorder.getBlob();
    setRecordedBlob(blob);
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
