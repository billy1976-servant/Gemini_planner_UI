"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import type { StudyDeck } from "../study/StudySlide";
import type { StudyPage } from "./StudyPagesManager";
import type { SessionEvent } from "./session-timeline";
import type { AnnotationEvent } from "./annotation-timeline";
import { formatTime } from "../utils/formattime";
import {
  getCurrentSlideIndex,
  getCurrentSessionSlide,
  getAnnotationsUpToTime,
} from "./replay-derivation";

export interface SessionReplayViewerProps {
  /** Recording blob (audio or video). */
  recordedBlob: Blob | null;
  /** Session events (slide-change, annotation) ordered by timestamp. */
  sessionTimeline: SessionEvent[];
  /** Annotation events for drawing replay. */
  annotationTimeline: AnnotationEvent[];
  /** Deck used during the session (pre-loaded slides). */
  deck: StudyDeck | null;
  /** Session-captured study pages (with imageUrl) when no deck was used or for extra slides. */
  sessionStudyPages?: StudyPage[];
  accentColor?: string;
}

export function SessionReplayViewer({
  recordedBlob,
  sessionTimeline,
  annotationTimeline,
  deck,
  sessionStudyPages = [],
  accentColor = "#f97316",
}: SessionReplayViewerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [durationSec, setDurationSec] = useState(0);

  const currentSlideIndex = getCurrentSlideIndex(sessionTimeline, currentTimeSec);
  const deckSlide = deck?.slides[currentSlideIndex] ?? null;
  const sessionSlide = getCurrentSessionSlide(sessionStudyPages, currentTimeSec);
  const currentSlide = deckSlide ?? (sessionSlide && sessionSlide.imageUrl ? { imageUrl: sessionSlide.imageUrl, title: sessionSlide.title } : null);
  const currentSlideId = deckSlide?.id ?? sessionSlide?.id ?? "";
  const annotationsToShow = getAnnotationsUpToTime(annotationTimeline, currentSlideId, currentTimeSec);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !recordedBlob) return;
    el.src = URL.createObjectURL(recordedBlob);
    return () => {
      if (el.src) URL.revokeObjectURL(el.src);
    };
  }, [recordedBlob]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const onTimeUpdate = () => setCurrentTimeSec(el.currentTime);
    const onDurationChange = () => setDurationSec(el.duration);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    el.addEventListener("timeupdate", onTimeUpdate);
    el.addEventListener("durationchange", onDurationChange);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    return () => {
      el.removeEventListener("timeupdate", onTimeUpdate);
      el.removeEventListener("durationchange", onDurationChange);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
    };
  }, [recordedBlob]);

  const play = useCallback(() => videoRef.current?.play(), []);
  const pause = useCallback(() => videoRef.current?.pause(), []);
  const seek = useCallback((sec: number) => {
    const el = videoRef.current;
    if (el) {
      el.currentTime = Math.max(0, Math.min(sec, el.duration || 0));
      setCurrentTimeSec(el.currentTime);
    }
  }, []);

  // Draw annotations on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const w = rect.width;
    const h = rect.height;
    ctx.clearRect(0, 0, w, h);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const e of annotationsToShow) {
      if (e.path.length < 2) continue;
      if (e.type === "draw") {
        ctx.lineWidth = e.width || 3;
        ctx.globalAlpha = 1;
        ctx.strokeStyle = e.color || accentColor;
      } else if (e.type === "highlight") {
        ctx.lineWidth = e.width || 16;
        ctx.globalAlpha = 0.4;
        ctx.strokeStyle = e.color || accentColor;
      } else {
        ctx.lineWidth = e.width || 24;
        ctx.globalAlpha = 1;
        ctx.strokeStyle = "#ffffff";
      }
      ctx.beginPath();
      ctx.moveTo(e.path[0]!.x * w, e.path[0]!.y * h);
      for (let i = 1; i < e.path.length; i++) {
        ctx.lineTo(e.path[i]!.x * w, e.path[i]!.y * h);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }, [annotationsToShow, accentColor]);

  if (!recordedBlob) {
    return (
      <div style={{ padding: "1rem", color: "var(--prayer-text-muted)", fontSize: "0.875rem" }}>
        No recording to replay. Record a session first, then export or replay here.
      </div>
    );
  }

  return (
    <div
      className="session-replay-viewer"
      style={{
        marginTop: "1rem",
        borderRadius: 12,
        overflow: "hidden",
        border: "1px solid var(--prayer-card-border)",
        background: "var(--prayer-card-bg)",
      }}
    >
      <div style={{ position: "relative", aspectRatio: "16/10", maxHeight: 400, background: "#000" }}>
        {currentSlide ? (
          <>
            <img
              src={currentSlide.imageUrl}
              alt={currentSlide.title}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "contain",
              }}
            />
            <canvas
              ref={canvasRef}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
              }}
            />
          </>
        ) : null}
        {!currentSlide && (
          <video
            ref={videoRef}
            controls
            playsInline
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        )}
      </div>
      {currentSlide && (
        <div style={{ padding: "0.25rem 0.75rem", borderTop: "1px solid var(--prayer-card-border)" }}>
          <video
            ref={videoRef}
            controls
            playsInline
            style={{ width: "100%", maxHeight: 80, objectFit: "contain" }}
          />
        </div>
      )}
      <div
        style={{
          padding: "0.5rem 0.75rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          flexWrap: "wrap",
          borderTop: "1px solid var(--prayer-card-border)",
        }}
      >
        <button
          type="button"
          onClick={playing ? pause : play}
          style={{
            padding: "0.35rem 0.75rem",
            borderRadius: 8,
            border: "1px solid var(--prayer-card-border)",
            background: "var(--prayer-play-bg)",
            color: "#fff",
            cursor: "pointer",
            fontSize: "0.875rem",
          }}
        >
          {playing ? "Pause" : "Play"}
        </button>
        <input
          type="range"
          min={0}
          max={durationSec || 100}
          value={currentTimeSec}
          onChange={(e) => seek(Number(e.target.value))}
          style={{ flex: 1, minWidth: 100 }}
        />
        <span style={{ fontSize: "0.8125rem", color: "var(--prayer-text-muted)" }}>
          {formatTime(currentTimeSec)} / {formatTime(durationSec)}
        </span>
        {(deck || sessionStudyPages.filter((p) => p.imageUrl).length > 0) && (
          <span style={{ fontSize: "0.8125rem", color: "var(--prayer-text-muted)" }}>
            {deck
              ? `Slide ${currentSlideIndex + 1} / ${deck.slides.length}`
              : `Study page at ${Math.floor(currentTimeSec / 60)}:${String(Math.floor(currentTimeSec % 60)).padStart(2, "0")}`}
          </span>
        )}
      </div>
    </div>
  );
}
