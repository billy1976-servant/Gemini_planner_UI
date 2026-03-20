"use client";

import React from "react";
import { useSyncExternalStore } from "react";
import { subscribeState, getState } from "@/state/state-store";
import { getSlice, writeSlice } from "./prayer-room-session.state";
import type { StudyDeck, StudySlide } from "../study/StudySlide";
import { EmptyContentState } from "./EmptyContentState";

export interface SlideViewerProps {
  roomId: string;
  /** When true, show navigation controls (host). */
  canNavigate?: boolean;
}

export function SlideViewer({ roomId, canNavigate = false }: SlideViewerProps) {
  useSyncExternalStore(subscribeState, getState, getState);
  const { activeDeck: deck, currentSlideIndex } = getSlice(roomId);
  if (!deck || deck.slides.length === 0) {
    return (
      <EmptyContentState
        className="prayer-slide-viewer-empty"
        message="No slide deck loaded. Open Host controls and choose a deck, or add slides."
      />
    );
  }

  const slides = deck.slides;
  const index = Math.max(0, Math.min(currentSlideIndex, slides.length - 1));
  const slide: StudySlide = slides[index]!;

  return (
    <div
      className="prayer-slide-viewer"
      style={{
        position: "relative",
        marginTop: "1rem",
        borderRadius: 12,
        overflow: "hidden",
        border: "1px solid var(--prayer-card-border, rgba(148,163,184,0.35))",
        background: "rgba(15,23,42,0.8)",
      }}
    >
      <div style={{ position: "relative", aspectRatio: "16/10", maxHeight: 360 }}>
        <img
          src={slide.imageUrl}
          alt={slide.title}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            display: "block",
          }}
        />
        {canNavigate && (
          <>
            <button
              type="button"
              onClick={() => writeSlice(roomId, { currentSlideIndex: Math.max(0, currentSlideIndex - 1) })}
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
              }}
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() =>
                writeSlice(roomId, {
                  currentSlideIndex: Math.min(currentSlideIndex + 1, slides.length - 1),
                })
              }
              disabled={index >= slides.length - 1}
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
                cursor: index >= slides.length - 1 ? "not-allowed" : "pointer",
                fontSize: "1rem",
                opacity: index >= slides.length - 1 ? 0.5 : 1,
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
          {slide.title || "Untitled"} ({index + 1} / {slides.length})
        </span>
        {canNavigate && slides.length > 1 && (
          <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => writeSlice(roomId, { currentSlideIndex: i })}
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
