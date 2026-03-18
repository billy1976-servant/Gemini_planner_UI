"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { uploadPrayer } from "@/01_App/HIClarify/Christian/Prayer/api/prayer-api";
import type { Prayer } from "@/01_App/HIClarify/Christian/Prayer/PrayerTypes";
import { getDraft, saveDraft, deleteDraft } from "@/01_App/HIClarify/Christian/Prayer/utils/prayerDraftStore";
import { formatTime } from "@/01_App/HIClarify/Christian/Prayer/utils/formatTime";
import { createRecordingEngine } from "@/01_App/HIClarify/Christian/Prayer/room/recording-engine";

export type RecordingType = "audio" | "video" | "screen";

export interface RecorderModuleProps {
  groupId?: string | null;
  onPublished?: (prayer: Prayer) => void;
  onCancel: () => void;
  /** When set, load this draft so user can re-edit and publish or save again. */
  initialDraftId?: string | null;
  /** When set, show "My snapshots" list and allow opening a draft to edit. */
  onOpenSnapshots?: () => void;
}

function getMimeType(recordingType: RecordingType): string {
  return recordingType === "audio" ? "audio/webm" : "video/webm";
}

export function RecorderModule({
  groupId,
  onPublished,
  onCancel,
  initialDraftId,
  onOpenSnapshots,
}: RecorderModuleProps) {
  const { data: session } = useSession();
  const [recordingType, setRecordingType] = useState<RecordingType>("audio");
  const [phase, setPhase] = useState<"idle" | "recording" | "stopped">("idle");
  const [recordDuration, setRecordDuration] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [prayerText, setPrayerText] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [savingSnapshot, setSavingSnapshot] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedDraftId, setLoadedDraftId] = useState<string | null>(initialDraftId ?? null);

  const recordingEngineRef = useRef<ReturnType<typeof createRecordingEngine> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  if (!recordingEngineRef.current) {
    recordingEngineRef.current = createRecordingEngine();
  }

  const loadDraft = useCallback(async (draftId: string) => {
    try {
      const draft = await getDraft(draftId);
      if (!draft) return;
      setTitle(draft.title);
      setDescription(draft.description);
      setPrayerText(draft.prayerText);
      setRecordedBlob(draft.blob ?? null);
      setRecordingType(draft.mediaType);
      setLoadedDraftId(draftId);
      setPhase(draft.blob ? "stopped" : "idle");
      setError(null);
    } catch (e) {
      setError("Could not load snapshot.");
    }
  }, []);

  useEffect(() => {
    if (initialDraftId) loadDraft(initialDraftId);
  }, [initialDraftId, loadDraft]);

  const getStream = useCallback(async (type: RecordingType): Promise<MediaStream | null> => {
    try {
      if (type === "audio") {
        return await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      if (type === "video") {
        return await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      }
      if (type === "screen") {
        return await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const startRecording = useCallback(
    async (type: RecordingType) => {
      setError(null);
      setRecordingType(type);
      const stream = await getStream(type);
      if (!stream) {
        setError(
          type === "screen"
            ? "Could not access screen. Allow screen share and try again."
            : type === "video"
              ? "Could not access camera or microphone."
              : "Could not access microphone."
        );
        return;
      }
      streamRef.current = stream;
      const engine = recordingEngineRef.current!;
      engine.start(stream, getMimeType(type));
      setPhase("recording");
      setRecordDuration(0);
      timerRef.current = setInterval(() => {
        setRecordDuration(engine.getDurationSec());
      }, 1000);
    },
    [getStream]
  );

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const engine = recordingEngineRef.current;
    if (engine?.isRecording()) {
      engine.stop();
      setRecordDuration(engine.getDurationSec());
      setRecordedBlob(engine.getBlob());
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setPhase("stopped");
  }, []);

  const handleCancel = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    const engine = recordingEngineRef.current;
    if (engine?.isRecording()) engine.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setRecordedBlob(null);
    setPhase("idle");
    setError(null);
    setLoadedDraftId(null);
    onCancel();
  }, [onCancel]);

  const handleSaveSnapshot = useCallback(async () => {
    setError(null);
    setSavingSnapshot(true);
    try {
      await saveDraft({
        id: loadedDraftId ?? undefined,
        title: title.trim() || "Untitled snapshot",
        description,
        prayerText,
        mediaType: recordingType,
        blob: recordedBlob ?? undefined,
      });
      setLoadedDraftId(null);
      setError(null);
      onOpenSnapshots?.();
    } catch (e) {
      setError("Could not save snapshot.");
    } finally {
      setSavingSnapshot(false);
    }
  }, [title, description, prayerText, recordingType, recordedBlob, loadedDraftId, onOpenSnapshots]);

  const handlePublish = useCallback(async () => {
    if (!recordedBlob || !title.trim()) {
      setError("Title and a recording are required.");
      return;
    }
    setError(null);
    setPublishing(true);
    try {
      const formData = new FormData();
      const ext = recordingType === "audio" ? "recording.webm" : "recording.webm";
      formData.append("audio", recordedBlob, ext);
      formData.append("duration", String(recordDuration));
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("prayerText", prayerText.trim());
      formData.append("published", "true");
      formData.append("mediaType", recordingType);
      if (session?.user?.email) formData.append("userId", session.user.email);
      if (session?.user?.name) formData.append("userName", session.user.name);
      const prayer = await uploadPrayer(formData, groupId ?? undefined);
      if (prayer) {
        if (loadedDraftId) await deleteDraft(loadedDraftId);
        onPublished?.(prayer);
        onCancel();
      } else {
        setError("Publish failed.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Publish failed");
    } finally {
      setPublishing(false);
    }
  }, [
    recordedBlob,
    recordDuration,
    title,
    description,
    prayerText,
    recordingType,
    session,
    groupId,
    loadedDraftId,
    onPublished,
    onCancel,
  ]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  return (
    <div className="prayer-recorder-module" data-module="recorder">
      {/* Recording type: always visible so tools don't "disappear" */}
      <div className="prayer-recorder-type-row" style={{ marginBottom: "1rem" }}>
        <span style={{ fontSize: "0.875rem", color: "var(--prayer-text-muted)", marginRight: "0.5rem" }}>
          Record:
        </span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          <button
            type="button"
            className="prayer-recorder-type-btn"
            onClick={() => phase === "idle" && setRecordingType("audio")}
            disabled={phase === "recording"}
            style={{
              padding: "0.4rem 0.75rem",
              borderRadius: 8,
              border: "1px solid var(--prayer-card-border)",
              background: recordingType === "audio" ? "var(--prayer-play-bg)" : "transparent",
              color: recordingType === "audio" ? "#fff" : "var(--prayer-text)",
              cursor: phase === "recording" ? "not-allowed" : "pointer",
              fontSize: "0.8125rem",
            }}
          >
            Audio only
          </button>
          <button
            type="button"
            className="prayer-recorder-type-btn"
            onClick={() => phase === "idle" && setRecordingType("video")}
            disabled={phase === "recording"}
            style={{
              padding: "0.4rem 0.75rem",
              borderRadius: 8,
              border: "1px solid var(--prayer-card-border)",
              background: recordingType === "video" ? "var(--prayer-play-bg)" : "transparent",
              color: recordingType === "video" ? "#fff" : "var(--prayer-text)",
              cursor: phase === "recording" ? "not-allowed" : "pointer",
              fontSize: "0.8125rem",
            }}
          >
            Prayer (video)
          </button>
          <button
            type="button"
            className="prayer-recorder-type-btn"
            onClick={() => phase === "idle" && setRecordingType("screen")}
            disabled={phase === "recording"}
            style={{
              padding: "0.4rem 0.75rem",
              borderRadius: 8,
              border: "1px solid var(--prayer-card-border)",
              background: recordingType === "screen" ? "var(--prayer-play-bg)" : "transparent",
              color: recordingType === "screen" ? "#fff" : "var(--prayer-text)",
              cursor: phase === "recording" ? "not-allowed" : "pointer",
              fontSize: "0.8125rem",
            }}
          >
            Screen
          </button>
        </div>
        {onOpenSnapshots && (
          <button
            type="button"
            onClick={onOpenSnapshots}
            style={{
              marginLeft: "auto",
              padding: "0.35rem 0.6rem",
              fontSize: "0.8125rem",
              color: "var(--prayer-accent)",
              background: "none",
              border: "none",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            My snapshots
          </button>
        )}
      </div>

      {phase === "idle" && (
        <div className="prayer-recorder-idle">
          <p style={{ fontSize: "0.875rem", color: "var(--prayer-text-muted)", marginBottom: "0.75rem" }}>
            {recordingType === "audio" && "Record with your microphone only."}
            {recordingType === "video" && "Record with camera and microphone (prayer video)."}
            {recordingType === "screen" && "Record your screen and optional microphone."}
          </p>
          <button
            type="button"
            className="prayer-recorder-start-btn"
            onClick={() => startRecording(recordingType)}
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
            <span>Recording ({recordingType})</span>
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

      {(phase === "stopped" && recordedBlob) || (phase === "stopped" && !recordedBlob && loadedDraftId) ? (
        <div className="prayer-recorder-publish">
          {recordedBlob && (
            <p className="prayer-recorder-stopped-label">
              Recorded {formatTime(recordDuration)} ({recordingType})
            </p>
          )}
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
          <label htmlFor="recorder-prayer-text" className="prayer-recorder-label">
            Prayer text (optional)
          </label>
          <textarea
            id="recorder-prayer-text"
            value={prayerText}
            onChange={(e) => setPrayerText(e.target.value)}
            placeholder="Full prayer text…"
            className="prayer-recorder-input"
            rows={3}
          />
          {recordedBlob && recordingType !== "audio" && (
            <div style={{ marginBottom: "0.75rem" }}>
              <video
                src={URL.createObjectURL(recordedBlob)}
                controls
                style={{ width: "100%", maxHeight: 200, borderRadius: 8 }}
              />
            </div>
          )}
          {recordedBlob && recordingType === "audio" && (
            <div style={{ marginBottom: "0.75rem" }}>
              <audio src={URL.createObjectURL(recordedBlob)} controls style={{ width: "100%", maxHeight: 40 }} />
            </div>
          )}
          {error && <p className="prayer-recorder-error">{error}</p>}
          <div className="prayer-recorder-actions" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
            <button
              type="button"
              className="prayer-recorder-publish-btn"
              onClick={handlePublish}
              disabled={publishing || !title.trim() || !recordedBlob}
            >
              {publishing ? "Publishing…" : "Publish"}
            </button>
            <button
              type="button"
              onClick={handleSaveSnapshot}
              disabled={savingSnapshot}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: 8,
                border: "1px solid var(--prayer-card-border)",
                background: "transparent",
                color: "var(--prayer-text)",
                cursor: savingSnapshot ? "wait" : "pointer",
                fontSize: "0.875rem",
              }}
            >
              {savingSnapshot ? "Saving…" : "Save snapshot"}
            </button>
            <button type="button" className="prayer-recorder-cancel-btn" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
