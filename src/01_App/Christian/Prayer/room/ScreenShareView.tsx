"use client";

import React, { useEffect, useRef } from "react";

export interface ScreenShareViewProps {
  stream: MediaStream | null;
}

export function ScreenShareView({ stream }: ScreenShareViewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (stream) {
      el.srcObject = stream;
      el.play().catch(() => {
        // Autoplay might be blocked; user interaction with host controls will usually unlock it.
      });
    } else {
      el.srcObject = null;
    }
  }, [stream]);

  if (!stream) return null;

  return (
    <div
      className="prayer-screen-share"
      style={{
        marginTop: "1rem",
        borderRadius: 12,
        overflow: "hidden",
        border: "1px solid var(--prayer-card-border, rgba(148,163,184,0.35))",
        background: "rgba(15,23,42,0.8)",
      }}
    >
      <video
        ref={videoRef}
        style={{ width: "100%", maxHeight: 360, display: "block", background: "black" }}
        autoPlay
        playsInline
        muted
      />
    </div>
  );
}

