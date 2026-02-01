"use client";
/**
 * Media Atom
 * Phase 9 - Media System
 * 
 * Image/video with aspect ratio, object-fit, placeholders
 */

import { useState } from "react";

export type MediaAtomProps = {
  params?: {
    aspectRatio?: string;
    objectFit?: "cover" | "contain" | "fill" | "none";
    radius?: string;
    placeholder?: string;
    placeholderColor?: string;
  };
  children?: React.ReactNode;
  src?: string;
  alt?: string;
  caption?: string;
};

export default function MediaAtom({
  params = {},
  children,
  src,
  alt,
  caption,
}: MediaAtomProps) {
  const {
    aspectRatio,
    objectFit = "cover",
    radius = "0",
    placeholder,
    placeholderColor,
  } = params;
  const placeholderBg = placeholderColor ?? "var(--color-bg-muted, #f3f4f6)";
  const placeholderText = "var(--color-text-muted)";
  const emojiSize = "var(--font-size-2xl)";
  const captionSize = "var(--font-size-sm)";

  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // If children provided, render them directly
  if (children) {
    return (
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: aspectRatio || "auto",
          borderRadius: radius,
          overflow: "hidden",
        }}
      >
        {children}
      </div>
    );
  }

  // Show placeholder if no src or error
  if (!src || error) {
    return (
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: aspectRatio || "16/9",
          background: placeholderBg,
          borderRadius: radius,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: placeholderText,
          fontSize: emojiSize,
        }}
      >
        {placeholder || "📷"}
      </div>
    );
  }

  // Non-URL src (emoji, symbol): render as text in a styled box instead of <img>
  const isUrl = typeof src === "string" && (src.startsWith("http") || src.startsWith("/"));
  if (!isUrl) {
    return (
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: aspectRatio || "16/9",
          background: placeholderBg,
          borderRadius: radius,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: emojiSize,
          color: placeholderText,
          lineHeight: 1,
        }}
      >
        {src}
      </div>
    );
  }

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
      }}
    >
      {/* Aspect ratio wrapper */}
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: aspectRatio || "auto",
          borderRadius: radius,
          overflow: "hidden",
          background: loaded ? "transparent" : placeholderBg,
        }}
      >
        {/* Loading placeholder */}
        {!loaded && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: placeholderText,
              fontSize: emojiSize,
            }}
          >
            {placeholder || "📷"}
          </div>
        )}

        {/* Image */}
        <img
          src={src}
          alt={alt || ""}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          style={{
            width: "100%",
            height: "100%",
            objectFit,
            display: loaded ? "block" : "none",
          }}
        />
      </div>

      {/* Caption */}
      {caption && (
        <div
          style={{
            marginTop: "var(--spacing-2)",
            fontSize: captionSize,
            color: placeholderText,
            textAlign: "center",
          }}
        >
          {caption}
        </div>
      )}
    </div>
  );
}
