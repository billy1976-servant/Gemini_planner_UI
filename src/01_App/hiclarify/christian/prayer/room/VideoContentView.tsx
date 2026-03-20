"use client";

import React, { useEffect, useRef } from "react";

export interface VideoContentViewProps {
  /** Local user's video track (e.g. host's camera). */
  localVideoTrack: MediaStreamTrack | null;
  /** Whether local video is enabled. */
  videoEnabled: boolean;
  /** First available remote video stream (e.g. first participant with video). */
  firstRemoteStream?: MediaStream | null;
}

/** Single-video content area so annotations can overlay when no slide/screen share but participant video exists. */
export function VideoContentView({
  localVideoTrack,
  videoEnabled,
  firstRemoteStream,
}: VideoContentViewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const hasStream = (videoEnabled && localVideoTrack) || firstRemoteStream;

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const stream =
      videoEnabled && localVideoTrack
        ? new MediaStream([localVideoTrack])
        : firstRemoteStream ?? null;
    if (stream) {
      el.srcObject = stream;
      el.play().catch(() => {});
    } else {
      el.srcObject = null;
    }
    return () => {
      el.srcObject = null;
    };
  }, [videoEnabled, localVideoTrack, firstRemoteStream]);

  if (!hasStream) return null;

  return (
    <div
      className="prayer-video-content-view"
      style={{
        marginTop: "1rem",
        borderRadius: 12,
        overflow: "hidden",
        border: "1px solid var(--prayer-card-border, rgba(148,163,184,0.35))",
        background: "rgba(15,23,42,0.8)",
        position: "relative",
        zIndex: 1,
      }}
    >
      <div style={{ position: "relative", aspectRatio: "16/10", maxHeight: 360 }}>
        <video
          ref={videoRef}
          style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
          playsInline
          muted
        />
      </div>
    </div>
  );
}
