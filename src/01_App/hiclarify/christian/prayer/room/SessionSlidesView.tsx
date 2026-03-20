"use client";

import React from "react";
import { useSyncExternalStore } from "react";
import { subscribeState, getState } from "@/state/state-store";
import { getSlice, writeSlice } from "./prayer-room-session.state";
import type { StudyPage } from "./StudyPagesManager";
import { EmptyContentState } from "./EmptyContentState";

export interface SessionSlidesViewProps {
  roomId: string;
  canNavigate?: boolean;
}

/** Displays session-captured study pages (with imageUrl) in the same layout as SlideViewer for annotation overlay. */
export function SessionSlidesView({ roomId, canNavigate = false }: SessionSlidesViewProps) {
  useSyncExternalStore(subscribeState, getState, getState);
  const { studyPages: pages, currentSessionSlideIndex: currentIndex } = getSlice(roomId);
  const withImages = pages.filter((p) => p && p.imageUrl);
  const index = Math.max(0, Math.min(currentIndex, withImages.length - 1));
  const slide = withImages[index];

  if (withImages.length === 0 || !slide || !slide.imageUrl) {
    return (
      <EmptyContentState
        className="prayer-session-slides-empty"
        message='Save a page to see it here. Use "Save page" in Host controls to capture the current slide or screen.'
      />
    );
  }

  return (
    <div
      className="prayer-session-slides-viewer"
      style={{
        position: "relative",
        marginTop: "1rem",
        borderRadius: 12,
        overflow: "hidden",
        border: "1px solid var(--prayer-card-border, rgba(148,163,184,0.35))",
        background: "rgba(15,23,42,0.8)",
        zIndex: 1,
      }}
    >
      <div style={{ position: "relative", aspectRatio: "16/10", maxHeight: 360 }}>
        <img
          src={slide.imageUrl}
          alt={slide.title ?? ""}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            display: "block",
          }}
        />
        {canNavigate && withImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={() =>
                writeSlice(roomId, { currentSessionSlideIndex: Math.max(0, currentIndex - 1) })
              }
              disabled={index <= 0}
              aria-label="Previous slide"
              style={{
                position: "absolute",
                left: "0.5rem",
                top: "50%",
                transform: "translateY(-50%)",
                padding: "0.5rem 0.75rem",
                borderRadius: 8,
                border: "1px solid var(--prayer-card-border)",
                background: "rgba(0,0,0,0.5)",
                color: "#fff",
                cursor: index <= 0 ? "not-allowed" : "pointer",
                fontSize: "1rem",
                opacity: index <= 0 ? 0.5 : 1,
                zIndex: 2,
              }}
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() =>
                writeSlice(roomId, {
                  currentSessionSlideIndex: Math.min(currentIndex + 1, withImages.length - 1),
                })
              }
              disabled={index >= withImages.length - 1}
              aria-label="Next slide"
              style={{
                position: "absolute",
                right: "0.5rem",
                top: "50%",
                transform: "translateY(-50%)",
                padding: "0.5rem 0.75rem",
                borderRadius: 8,
                border: "1px solid var(--prayer-card-border)",
                background: "rgba(0,0,0,0.5)",
                color: "#fff",
                cursor: index >= withImages.length - 1 ? "not-allowed" : "pointer",
                fontSize: "1rem",
                opacity: index >= withImages.length - 1 ? 0.5 : 1,
                zIndex: 2,
              }}
            >
              ›
            </button>
          </>
        )}
      </div>
      <div
        style={{
          padding: "0.5rem 0.75rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.5rem",
          borderTop: "1px solid var(--prayer-card-border, rgba(148,163,184,0.2))",
          background: "var(--prayer-card-bg, rgba(30,41,59,0.6))",
        }}
      >
        <span style={{ fontSize: "0.8125rem", color: "var(--prayer-text-muted)" }}>
          {slide?.title || "Untitled"} ({index + 1} / {withImages.length})
        </span>
        {canNavigate && withImages.length > 1 && (
          <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
            {withImages.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => writeSlice(roomId, { currentSessionSlideIndex: i })}
                aria-label={`Go to slide ${i + 1}`}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  border: "none",
                  background: i === index ? "var(--prayer-play-bg)" : "var(--prayer-card-border)",
                  cursor: "pointer",
                  padding: 0,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
