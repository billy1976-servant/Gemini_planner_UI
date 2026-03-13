"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { uploadPrayer } from "@/01_App/Christian/Prayer/api/prayer-api";
import type { Prayer } from "@/01_App/Christian/Prayer/PrayerTypes";

/**
 * Dedicated recorder module: record indicator, timer, stop, cancel only.
 * After stop, minimal title/description form then publish via existing uploadPrayer.
 * Self-contained; can be reused elsewhere. Renders only when mode === "record".
 */

export interface RecorderModuleProps {
  groupId?: string | null;
  onPublished?: (prayer: Prayer) => void;
  onCancel: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function RecorderModule({ groupId, onPublished, onCancel }: RecorderModuleProps) {
  const { data: session } = useSession();
  const [phase, setPhase] = useState<"idle" | "recording" | "stopped">("idle");
  const [recordDuration, setRecordDuration] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        if (chunksRef.current.length > 0) {
          setRecordedBlob(new Blob(chunksRef.current, { type: "audio/webm" }));
        }
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };

      recorder.start(200);
      setPhase("recording");
      startTimeRef.current = Date.now();
      setRecordDuration(0);
      timerRef.current = setInterval(() => {
        setRecordDuration((d) => Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } catch {
      setError("Could not access microphone.");
      setPhase("idle");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const rec = mediaRecorderRef.current;
    if (rec && rec.state !== "inactive") rec.stop();
    setPhase("stopped");
  }, []);

  const handleCancel = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const rec = mediaRecorderRef.current;
    if (rec && rec.state !== "inactive") rec.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setRecordedBlob(null);
    setPhase("idle");
    setError(null);
    onCancel();
  }, [onCancel]);

  const handlePublish = useCallback(async () => {
    if (!recordedBlob || !title.trim()) {
      setError("Title is required.");
      return;
    }
    setError(null);
    setPublishing(true);
    try {
      const formData = new FormData();
      formData.append("audio", recordedBlob, "recording.webm");
      formData.append("duration", String(recordDuration));
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("prayerText", "");
      formData.append("published", "true");
      if (session?.user?.email) formData.append("userId", session.user.email);
      if (session?.user?.name) formData.append("userName", session.user.name);
      const prayer = await uploadPrayer(formData, groupId ?? undefined);
      onPublished?.(prayer);
      onCancel();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Publish failed");
    } finally {
      setPublishing(false);
    }
  }, [recordedBlob, recordDuration, title, description, session, groupId, onPublished, onCancel]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className="prayer-recorder-module" data-module="recorder">
      {phase === "idle" && (
        <div className="prayer-recorder-idle">
          <button
            type="button"
            className="prayer-recorder-start-btn"
            onClick={startRecording}
            aria-label="Start recording"
          >
            Start recording
          </button>
          <button type="button" className="prayer-recorder-cancel-btn" onClick={handleCancel}>
            Cancel
          </button>
        </div>
      )}

      {phase === "recording" && (
        <div className="prayer-recorder-active">
          <div className="prayer-recorder-indicator">
            <span className="prayer-recorder-dot" aria-hidden />
            <span>Recording</span>
          </div>
          <div className="prayer-recorder-timer">{formatTime(recordDuration)}</div>
          <div className="prayer-recorder-actions">
            <button type="button" className="prayer-recorder-stop-btn" onClick={stopRecording}>
              Stop
            </button>
            <button type="button" className="prayer-recorder-cancel-btn" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {phase === "stopped" && recordedBlob && (
        <div className="prayer-recorder-publish">
          <p className="prayer-recorder-stopped-label">Recorded {formatTime(recordDuration)}</p>
          <label htmlFor="recorder-title" className="prayer-recorder-label">
            Title *
          </label>
          <input
            id="recorder-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Prayer title"
            className="prayer-recorder-input"
          />
          <label htmlFor="recorder-desc" className="prayer-recorder-label">
            Description (optional)
          </label>
          <input
            id="recorder-desc"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description"
            className="prayer-recorder-input"
          />
          {error && <p className="prayer-recorder-error">{error}</p>}
          <div className="prayer-recorder-actions">
            <button
              type="button"
              className="prayer-recorder-publish-btn"
              onClick={handlePublish}
              disabled={publishing || !title.trim()}
            >
              {publishing ? "Publishing…" : "Publish"}
            </button>
            <button type="button" className="prayer-recorder-cancel-btn" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
