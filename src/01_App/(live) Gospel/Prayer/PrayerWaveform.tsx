"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";

export interface PrayerWaveformProps {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
  /** 0–1, played portion of the audio (left to right) */
  progress: number;
  width?: number;
  height?: number;
  /** Number of vertical bars spanning full width */
  barCount?: number;
}

/** Deterministic bar heights for waveform (no real audio data). Looks like audio levels left-to-right. */
function getBarLevel(index: number, total: number): number {
  const t = index / Math.max(1, total);
  const a = Math.sin(t * Math.PI * 4) * 0.5 + 0.5;
  const b = Math.sin(t * Math.PI * 7 + 1) * 0.5 + 0.5;
  const c = Math.sin(t * Math.PI * 11 + 2) * 0.5 + 0.5;
  return 0.28 + 0.52 * (a * 0.5 + b * 0.3 + c * 0.2);
}

/**
 * Full-width horizontal audio progress waveform. Many vertical bars left-to-right.
 * Played portion highlighted; remaining dimmed. Click-to-seek is handled by parent wrapper.
 */
export function PrayerWaveform({
  audioRef,
  isPlaying,
  progress,
  width: widthProp,
  height = 48,
  barCount = 100,
}: PrayerWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect?.width != null) setContainerWidth(Math.round(rect.width));
    });
    ro.observe(el);
    const rect = el.getBoundingClientRect();
    if (rect.width) setContainerWidth(Math.round(rect.width));
    return () => ro.disconnect();
  }, []);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, dpr: number) => {
      const scaleW = w * dpr;
      const scaleH = h * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, scaleW, scaleH);
      ctx.scale(dpr, dpr);

      const gap = 1;
      const barWidth = Math.max(1, Math.floor((w - (barCount - 1) * gap) / barCount));
      const halfH = h / 2;

      const container = containerRef.current;
      const activeColor = container
        ? getComputedStyle(container).getPropertyValue("--prayer-wave-active").trim() || "#a78bfa"
        : "#a78bfa";
      const inactiveFill = "rgba(148, 163, 184, 0.22)";

      for (let i = 0; i < barCount; i++) {
        const segmentStart = i / barCount;
        const segmentEnd = (i + 1) / barCount;
        const isPlayed = segmentEnd <= progress || (segmentStart < progress && progress < segmentEnd);
        const level = getBarLevel(i, barCount);
        const barH = Math.max(2, Math.floor(halfH * level));
        const x = Math.round(i * (barWidth + gap));
        const y = Math.round(halfH - barH / 2);

        ctx.fillStyle = isPlayed ? activeColor : inactiveFill;
        ctx.fillRect(x, y, barWidth, barH);
      }
    },
    [progress, barCount]
  );

  const w = widthProp ?? (containerWidth > 0 ? containerWidth : 320);
  const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || w <= 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const scaleW = Math.round(w * dpr);
    const scaleH = Math.round(height * dpr);
    canvas.width = scaleW;
    canvas.height = scaleH;

    const tick = () => {
      draw(ctx, w, height, dpr);
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw, w, height, dpr]);

  return (
    <div
      ref={containerRef}
      className="prayer-waveform"
      style={{ width: widthProp ? `${widthProp}px` : "100%", height: `${height}px`, minWidth: 0 }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", display: "block", verticalAlign: "middle" }}
        aria-hidden
      />
    </div>
  );
}
