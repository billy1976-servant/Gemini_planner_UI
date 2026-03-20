"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSyncExternalStore } from "react";
import { subscribeState, getState } from "@/state/state-store";
import { getSlice, writeSlice } from "./prayer-room-session.state";

export interface AnnotationPoint {
  x: number;
  y: number;
}

export interface AnnotationStroke {
  id: string;
  points: AnnotationPoint[];
  /** Optional mode for this stroke (default draw). */
  mode?: AnnotationMode;
}

export type AnnotationMode = "draw" | "highlight" | "rectangle" | "arrow" | "text" | "erase";
/** Toolbar tool ids; rectangle/arrow/text are placeholder (draw for now). */
export type AnnotationToolId = AnnotationMode | "clear" | "undo";

export interface AnnotationOverlayProps {
  roomId: string;
  onChange: (strokes: AnnotationStroke[]) => void;
  /** When false, overlay is read-only. */
  editable?: boolean;
  /** Stroke color (defaults to orange); use palette.accent when provided by ThemeProvider. */
  accentColor?: string;
  /** Current drawing mode. */
  mode?: AnnotationMode;
  onModeChange?: (mode: AnnotationMode) => void;
  /** When set, show Zoom-style toolbar (Pen, Highlight, Rectangle, Arrow, Text, Eraser, Clear, Undo). */
  showToolbar?: boolean;
}

export function AnnotationOverlay({
  roomId,
  onChange,
  editable = true,
  accentColor = "#f97316",
  mode = "draw",
  onModeChange,
  showToolbar = false,
}: AnnotationOverlayProps) {
  useSyncExternalStore(subscribeState, getState, getState);
  const { annotationStrokes: strokes } = getSlice(roomId);
  const onClear = useCallback(
    () => writeSlice(roomId, { annotationStrokes: [] }),
    [roomId]
  );
  const onUndo = useCallback(() => {
    const slice = getSlice(roomId);
    if (slice.annotationStrokes.length > 0) {
      writeSlice(roomId, { annotationStrokes: slice.annotationStrokes.slice(0, -1) });
    }
  }, [roomId]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const [currentStroke, setCurrentStroke] = useState<AnnotationStroke | null>(null);
  const [currentMode, setCurrentMode] = useState<AnnotationMode>(mode);

  const effectiveMode = onModeChange ? mode : currentMode;
  const setMode = onModeChange ?? setCurrentMode;
  /** For toolbar: rectangle/arrow/text use draw for storage; rendering treats draw/rectangle/arrow same. */
  const drawableMode: AnnotationMode =
    effectiveMode === "rectangle" || effectiveMode === "arrow" || effectiveMode === "text"
      ? "draw"
      : effectiveMode;

  const drawStrokes = useCallback(
    (ctx: CanvasRenderingContext2D | null, width: number, height: number) => {
      if (!ctx || width === 0 || height === 0) return;
      try {
        ctx.clearRect(0, 0, width, height);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        const allStrokes = currentStroke ? [...strokes, currentStroke] : strokes;

        for (const stroke of allStrokes) {
          const strokeMode = stroke.mode ?? "draw";
          const renderMode = strokeMode === "rectangle" || strokeMode === "arrow" ? "draw" : strokeMode;
          if (stroke.points.length < 2 && renderMode !== "erase") continue;
          if (renderMode === "draw") {
            ctx.lineWidth = 3;
            ctx.globalAlpha = 1;
            ctx.strokeStyle = accentColor;
          } else if (renderMode === "highlight") {
            ctx.lineWidth = 16;
            ctx.globalAlpha = 0.4;
            ctx.strokeStyle = accentColor;
          } else {
            ctx.lineWidth = 24;
            ctx.globalAlpha = 1;
            ctx.strokeStyle = "#ffffff";
          }
          ctx.beginPath();
          const [first, ...rest] = stroke.points;
          if (first) {
            ctx.moveTo(first.x * width, first.y * height);
            for (const p of rest) {
              if (p) ctx.lineTo(p.x * width, p.y * height);
            }
          }
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      } catch {
        // guard: never crash on draw
      }
    },
    [strokes, currentStroke, accentColor]
  );

  const resizeAndDraw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    const rect = container.getBoundingClientRect();
    const width = Math.max(0, Math.floor(rect.width));
    const height = Math.max(0, Math.floor(rect.height));
    if (width === 0 || height === 0) return;
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawStrokes(ctx, width, height);
    }
  }, [drawStrokes]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    resizeAndDraw();
    const ro = new ResizeObserver(() => resizeAndDraw());
    ro.observe(container);
    return () => ro.disconnect();
  }, [resizeAndDraw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const container = containerRef.current;
    const rect = container?.getBoundingClientRect();
    const w = rect ? Math.max(0, Math.floor(rect.width)) : 0;
    const h = rect ? Math.max(0, Math.floor(rect.height)) : 0;
    drawStrokes(ctx, w, h);
  }, [strokes, currentStroke, drawStrokes]);

  const getRelativePoint = useCallback(
    (clientX: number, clientY: number): AnnotationPoint | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (w === 0 || h === 0) return null;
      return {
        x: (clientX - rect.left) / w,
        y: (clientY - rect.top) / h,
      };
    },
    []
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (typeof console !== "undefined" && console.log) {
      console.log("ANNOTATION POINTER DOWN", e.clientX, e.clientY);
    }
    e.preventDefault();
    if (!editable) return;
    if (effectiveMode === "text") return; // placeholder: no-op
    isDrawingRef.current = true;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    const point = getRelativePoint(e.clientX, e.clientY);
    if (point) setCurrentStroke({ id: crypto.randomUUID(), points: [point], mode: drawableMode });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!editable || !isDrawingRef.current) return;
    const point = getRelativePoint(e.clientX, e.clientY);
    if (point)
      setCurrentStroke((prev) => (prev ? { ...prev, points: [...prev.points, point] } : prev));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (typeof console !== "undefined" && console.log) {
      console.log("ANNOTATION POINTER UP", e.clientX, e.clientY);
    }
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    if (!editable) return;
    isDrawingRef.current = false;
    setCurrentStroke((prev) => {
      if (!prev || prev.points.length < 2) return null;
      onChange([...strokes, prev]);
      return null;
    });
  };

  const handlePointerLeave = () => {
    if (!editable) return;
    isDrawingRef.current = false;
    setCurrentStroke((prev) => {
      if (!prev || prev.points.length < 2) return null;
      onChange([...strokes, prev]);
      return null;
    });
  };

  const toolButtons: { id: AnnotationMode | "clear" | "undo"; label: string; title: string; svg: React.ReactNode }[] = [
    { id: "draw", label: "Pen", title: "Pen", svg: <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" /> },
    { id: "highlight", label: "Highlight", title: "Highlight", svg: <path fill="currentColor" opacity={0.6} d="M6 14l3 3 6-6-3-3-6 6z" /> },
    { id: "rectangle", label: "Rect", title: "Rectangle", svg: <path fill="none" stroke="currentColor" strokeWidth={2} d="M4 6h16v12H4z" /> },
    { id: "arrow", label: "Arrow", title: "Arrow", svg: <path fill="currentColor" d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" /> },
    { id: "text", label: "Text", title: "Text (placeholder)", svg: <path fill="currentColor" d="M3 5v4h2V5h2v8h2V5h2v4h2V5h2v14H3z" /> },
    { id: "erase", label: "Eraser", title: "Eraser", svg: <path fill="currentColor" d="M16.24 3.56l4.95 4.94-2.83 2.83-4.95-4.95-8.49 8.49-2.82-2.83 8.48-8.48-4.95-4.95-2.83 2.83 4.95 4.95 8.48-8.49 2.83 2.83-8.48 8.49z" /> },
  ];

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 50,
        pointerEvents: editable ? "auto" : "none",
      }}
    >
      {showToolbar && editable && (
        <div
          className="prayer-annotation-toolbar"
          style={{
            position: "absolute",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 60,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.25rem",
            pointerEvents: "auto",
          }}
        >
          {toolButtons.map(({ id, label, title, svg }) => (
            <button
              key={id}
              type="button"
              title={title}
              onClick={() => id !== "clear" && id !== "undo" && setMode(id as AnnotationMode)}
              style={{
                padding: "0.4rem",
                borderRadius: 8,
                border: "1px solid var(--prayer-card-border, rgba(148,163,184,0.3))",
                background: effectiveMode === id ? accentColor : "rgba(0,0,0,0.5)",
                color: "#fff",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width={18} height={18} viewBox="0 0 24 24" style={{ display: "block" }}>
                {svg}
              </svg>
            </button>
          ))}
          {onUndo && strokes.length > 0 && (
            <button
              type="button"
              title="Undo"
              onClick={onUndo}
              style={{
                padding: "0.4rem",
                borderRadius: 8,
                border: "1px solid var(--prayer-card-border, rgba(148,163,184,0.3))",
                background: "rgba(0,0,0,0.5)",
                color: "#fff",
                cursor: "pointer",
                display: "inline-flex",
              }}
            >
              <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.44-.66C21.08 11.03 17.15 8 12.5 8z" />
              </svg>
            </button>
          )}
          {onClear && (
            <button
              type="button"
              title="Clear all"
              onClick={onClear}
              style={{
                padding: "0.4rem 0.5rem",
                borderRadius: 8,
                border: "1px solid var(--prayer-card-border, rgba(148,163,184,0.3))",
                background: "rgba(0,0,0,0.5)",
                color: "#fff",
                cursor: "pointer",
                fontSize: "0.75rem",
              }}
            >
              Clear
            </button>
          )}
        </div>
      )}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          zIndex: 51,
          pointerEvents: editable ? "auto" : "none",
          touchAction: "none",
          cursor: editable ? "crosshair" : "default",
          background: "transparent",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
      />
    </div>
  );
}
