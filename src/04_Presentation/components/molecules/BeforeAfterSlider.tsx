"use client";

import React, { useState, useCallback } from "react";

export type BeforeAfterSliderProps = {
  beforeSrc: string;
  afterSrc: string;
  altBefore?: string;
  altAfter?: string;
  className?: string;
  /** When true, applies a dark filter to the before image (same image as after = "dark container" effect). */
  darkenBefore?: boolean;
  /** How the images fit inside the slider frame. Use "contain" to avoid cropping. */
  objectFit?: "contain" | "cover" | "fill" | "none";
};

export default function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  altBefore = "Before",
  altAfter = "After",
  className = "",
  darkenBefore = false,
  objectFit = "contain",
}: BeforeAfterSliderProps) {
  const [position, setPosition] = useState(50);
  const [dragging, setDragging] = useState(false);

  const handleMove = useCallback(
    (clientX: number, rect: DOMRect) => {
      const x = clientX - rect.left;
      const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setPosition(pct);
    },
    []
  );

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    setDragging(true);
  }, []);

  React.useEffect(() => {
    if (!dragging) return;
    const rect = () => {
      const el = document.querySelector("[data-before-after-slider]");
      return el?.getBoundingClientRect() ?? new DOMRect(0, 0, 0, 0);
    };
    const onMove = (e: MouseEvent) => handleMove(e.clientX, rect());
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) handleMove(t.clientX, rect());
    };
    const onEnd = () => setDragging(false);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onEnd);
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("touchend", onEnd);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onEnd);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onEnd);
    };
  }, [dragging, handleMove]);

  const hasImages = beforeSrc || afterSrc;
  if (!hasImages) {
    return (
      <div
        data-before-after-slider
        className={className}
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "16/9",
          background: "var(--landing-steel-bg, #1a1d23)",
          borderRadius: "var(--radius-md, 8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--landing-steel-muted, #64748b)",
          fontSize: "0.875rem",
        }}
      >
        Before / After (add image URLs)
      </div>
    );
  }

  return (
    <div
      data-before-after-slider
      role="img"
      aria-label={`${altBefore} and ${altAfter} comparison`}
      className={className}
      style={{
        position: "relative",
        width: "100%",
        overflow: "hidden",
        borderRadius: "var(--radius-md, 8px)",
        aspectRatio: "16/9",
        userSelect: "none",
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {afterSrc && (
        <div
          style={{
            position: "absolute",
            inset: 0,
          }}
        >
          <img
            src={afterSrc}
            alt={altAfter}
            style={{
              width: "100%",
              height: "100%",
              objectFit,
              display: "block",
            }}
          />
        </div>
      )}
      {beforeSrc && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            clipPath: `inset(0 ${100 - position}% 0 0)`,
          }}
        >
          <img
            src={beforeSrc}
            alt={altBefore}
            style={{
              width: "100%",
              height: "100%",
              objectFit,
              display: "block",
              ...(darkenBefore && {
                filter: "brightness(0.35) contrast(1.05) saturate(0.85)",
              }),
            }}
          />
        </div>
      )}
      <div
        style={{
          position: "absolute",
          left: `${position}%`,
          top: 0,
          bottom: 0,
          width: 2,
          marginLeft: -1,
          background: "var(--landing-steel-fg, #e2e8f0)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: `${position}%`,
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: "var(--landing-steel-fg, #e2e8f0)",
          border: "2px solid var(--landing-steel-bg, #1a1d23)",
          pointerEvents: "none",
          boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
        }}
      />
    </div>
  );
}
