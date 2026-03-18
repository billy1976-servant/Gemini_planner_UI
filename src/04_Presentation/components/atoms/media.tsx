"use client";
/**
 * Media Atom
 * Phase 9 - Media System
 * 
 * Image/video with aspect ratio, object-fit, placeholders
 */

import { useState } from "react";
import { usePreviewTile } from "@/04_Presentation/contexts/PreviewTileContext";

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
  const { isPreviewTile } = usePreviewTile();
  const {
    aspectRatio,
    objectFit: objectFitParam = "cover",
    radius = "0",
    placeholder,
    placeholderColor,
  } = params;
  const objectFit = isPreviewTile ? "contain" : objectFitParam;
  const placeholderBg = placeholderColor ?? "var(--media-placeholder-bg)";
  const placeholderText = "var(--media-placeholder-text)";
  const emojiSize = "var(--media-emoji-size)";
  const captionSize = "var(--media-caption-size)";

  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [iconError, setIconError] = useState(false);

  // If children provided, render them directly
  if (children) {
    return (
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "100%",
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

  // Non-URL src: try icon name, else render as text (emoji, symbol)
  const isUrl = typeof src === "string" && (src.startsWith("http") || src.startsWith("/"));
  if (!isUrl) {
    // Attempt to load as icon from /icons/ directory
    if (!iconError) {
      const iconSrc = `/icons/${src}.svg`;
      return (
        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: aspectRatio || "1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src={iconSrc}
            alt={alt || src}
            onError={() => setIconError(true)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
          />
        </div>
      );
    }
    
    // Fallback: render as text in a styled box
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

  const wrapperAspectRatio = isPreviewTile ? "auto" : (aspectRatio || "auto");
  const imgHeight = isPreviewTile ? "auto" : "100%";

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: "100%",
        overflow: "hidden",
      }}
    >
      {/* Aspect ratio wrapper — in preview tile use auto so image can size naturally */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "100%",
          aspectRatio: wrapperAspectRatio,
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

        {/* Image — in preview tile: contain + height auto to avoid crop/stretch */}
        {typeof src === "string" && src && (
          <img
            src={src}
            alt={alt || ""}
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
            style={{
              width: "100%",
              maxWidth: "100%",
              height: imgHeight,
              display: loaded ? "block" : "none",
              objectFit,
            }}
          />
        )}
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
