"use client";

import React, { useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { uploadPrayer } from "./api/prayer-api";
import type { Prayer } from "./PrayerTypes";

export interface PrayerUploadProps {
  onUploaded?: (prayer: Prayer) => void;
  /** When set, new prayer is assigned to this group */
  groupId?: string | null;
}

export function PrayerUpload({ onUploaded, groupId }: PrayerUploadProps) {
  const { data: session } = useSession();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [prayerText, setPrayerText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingState, setRecordingState] = useState<"idle" | "recording" | "stopped">("idle");
  const [recordDuration, setRecordDuration] = useState(0);
  const [finalRecordDuration, setFinalRecordDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          setRecordedBlob(blob);
        }
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };

      recorder.start(200);
      setRecordingState("recording");
      startTimeRef.current = Date.now();
      setRecordDuration(0);
      timerRef.current = setInterval(() => {
        setRecordDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } catch (err) {
      setError("Could not access microphone. Allow microphone access and try again.");
      setRecordingState("idle");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const durationSec = Math.floor((Date.now() - startTimeRef.current) / 1000);
    setFinalRecordDuration(durationSec);
    const rec = mediaRecorderRef.current;
    if (rec && rec.state !== "inactive") {
      rec.stop();
    }
    setRecordingState("stopped");
  }, []);

  const clearRecording = useCallback(() => {
    setRecordedBlob(null);
    setRecordDuration(0);
    setFinalRecordDuration(0);
    setRecordingState("idle");
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const audioSource = file || recordedBlob;
      if (!audioSource || !title.trim()) {
        setError("Title and audio (file or recording) are required.");
        return;
      }
      setError(null);
      setLoading(true);
      try {
        const formData = new FormData();
        if (recordedBlob) {
          formData.append("audio", recordedBlob, "recording.webm");
          formData.append("duration", String(finalRecordDuration || recordDuration));
        } else if (file) {
          formData.append("audio", file);
        }
        formData.append("title", title.trim());
        formData.append("description", description.trim());
        formData.append("prayerText", prayerText.trim());
        formData.append("published", "true");
        if (session?.user?.email) formData.append("userId", session.user.email);
        if (session?.user?.name) formData.append("userName", session.user.name);
        const prayer = await uploadPrayer(formData, groupId ?? undefined);
        setSuccess(true);
        setTitle("");
        setDescription("");
        setPrayerText("");
        setFile(null);
        setRecordedBlob(null);
        setRecordDuration(0);
        setRecordingState("idle");
        onUploaded?.(prayer);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setLoading(false);
      }
    },
    [file, recordedBlob, title, description, prayerText, finalRecordDuration, recordDuration, session, onUploaded, groupId]
  );

  const hasAudio = !!file || !!recordedBlob;

  return (
    <div className="prayer-card" style={{ maxWidth: "420px" }}>
      <h2 className="prayer-title" style={{ marginBottom: "1rem" }}>Upload prayer</h2>
      <form className="prayer-upload-form" onSubmit={handleSubmit}>
        <label htmlFor="prayer-title">Title *</label>
        <input id="prayer-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Morning prayer" required />
        <label htmlFor="prayer-desc">Description</label>
        <input id="prayer-desc" type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" />
        <label htmlFor="prayer-text">Prayer text (optional)</label>
        <textarea id="prayer-text" value={prayerText} onChange={(e) => setPrayerText(e.target.value)} placeholder="Full prayer text…" />

        <label style={{ display: "block", marginTop: "0.75rem" }}>Record prayer</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center", marginBottom: "0.75rem" }}>
          {recordingState === "idle" && !recordedBlob && (
            <button
              type="button"
              onClick={startRecording}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: 8,
                border: "1px solid var(--prayer-play-bg)",
                background: "var(--prayer-play-bg)",
                color: "#fff",
                cursor: "pointer",
                fontSize: "0.875rem",
              }}
            >
              Record Prayer
            </button>
          )}
          {recordingState === "recording" && (
            <>
              <span style={{ fontSize: "0.875rem", color: "var(--prayer-text-muted)" }}>
                Recording… {Math.floor(recordDuration / 60)}:{String(recordDuration % 60).padStart(2, "0")}
              </span>
              <button type="button" onClick={stopRecording} style={{ padding: "0.5rem 1rem", borderRadius: 8, border: "1px solid #ef4444", background: "#ef4444", color: "#fff", cursor: "pointer", fontSize: "0.875rem" }}>
                Stop
              </button>
            </>
          )}
          {recordedBlob && (
            <>
              <span style={{ fontSize: "0.875rem", color: "var(--prayer-text-muted)" }}>Recorded (preview below)</span>
              <button type="button" onClick={clearRecording} style={{ padding: "0.35rem 0.75rem", borderRadius: 8, border: "1px solid var(--prayer-card-border)", background: "transparent", color: "var(--prayer-text)", cursor: "pointer", fontSize: "0.8rem" }}>
                Record again
              </button>
            </>
          )}
        </div>

        {recordedBlob && (
          <div style={{ marginBottom: "1rem" }}>
            <audio src={URL.createObjectURL(recordedBlob)} controls style={{ width: "100%", maxHeight: 40 }} />
          </div>
        )}

        <label htmlFor="prayer-audio">Or upload audio file</label>
        <input
          id="prayer-audio"
          type="file"
          accept="audio/*"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            setFile(f);
            if (f) setRecordedBlob(null);
          }}
          style={{ marginBottom: "1rem", color: "var(--prayer-text-muted)" }}
        />

        {error && <p style={{ color: "#f87171", fontSize: "0.875rem", marginBottom: "0.75rem" }}>{error}</p>}
        {success && <p style={{ color: "#86efac", fontSize: "0.875rem", marginBottom: "0.75rem" }}>Prayer published. Share the link below.</p>}
        <button type="submit" disabled={loading || !hasAudio || !title.trim()}>
          {loading ? "Publishing…" : "Publish prayer"}
        </button>
      </form>
    </div>
  );
}
