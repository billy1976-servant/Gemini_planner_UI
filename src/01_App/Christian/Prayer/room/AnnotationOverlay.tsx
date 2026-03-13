"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

export interface AnnotationPoint {
  x: number;
  y: number;
}

export interface AnnotationStroke {
  id: string;
  points: AnnotationPoint[];
}

export interface AnnotationOverlayProps {
  strokes: AnnotationStroke[];
  onChange: (strokes: AnnotationStroke[]) => void;
  /** When false, overlay is read-only. */
  editable?: boolean;
  /** Stroke color (defaults to orange); use palette.accent when provided by ThemeProvider. */
  accentColor?: string;
}

export function AnnotationOverlay({
  strokes,
  onChange,
  editable = true,
  accentColor = "#f97316",
}: AnnotationOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const [currentStroke, setCurrentStroke] = useState<AnnotationStroke | null>(null);

  const drawStrokes = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      ctx.clearRect(0, 0, width, height);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = 3;
      ctx.strokeStyle = accentColor;

      const allStrokes = currentStroke ? [...strokes, currentStroke] : strokes;

      for (const stroke of allStrokes) {
        if (stroke.points.length < 2) continue;
        ctx.beginPath();
        const [first, ...rest] = stroke.points;
        ctx.moveTo(first.x * width, first.y * height);
        for (const p of rest) {
          ctx.lineTo(p.x * width, p.y * height);
        }
        ctx.stroke();
      }
    },
    [strokes, currentStroke, accentColor]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawStrokes(ctx, rect.width, rect.height);
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [drawStrokes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    drawStrokes(ctx, rect.width, rect.height);
  }, [strokes, currentStroke, drawStrokes]);

  const getRelativePoint = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>): AnnotationPoint => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height,
    };
  };

  const handlePointerDown = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    if (!editable) return;
    isDrawingRef.current = true;
    const point = getRelativePoint(event);
    setCurrentStroke({ id: crypto.randomUUID(), points: [point] });
  };

  const handlePointerMove = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    if (!editable || !isDrawingRef.current) return;
    const point = getRelativePoint(event);
    setCurrentStroke((prev) => (prev ? { ...prev, points: [...prev.points, point] } : prev));
  };

  const handlePointerUp = () => {
    if (!editable) return;
    isDrawingRef.current = false;
    setCurrentStroke((prev) => {
      if (!prev || prev.points.length < 2) return null;
      onChange([...strokes, prev]);
      return null;
    });
  };

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: editable ? "auto" : "none",
        cursor: editable ? "crosshair" : "default",
        background: "transparent",
      }}
      onMouseDown={handlePointerDown}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
    />
  );
}

