"use client";

import React, { memo, useLayoutEffect, useRef, useState } from "react";
import { applyPaletteToElement } from "@/lib/site-renderer/palette-bridge";
import { getPaletteName } from "@/engine/core/palette-store";
import { palettes } from "@/palettes";
import { landingScreenPresentationAttrs } from "@/lib/landing-screen-presentation";

const DEFAULT_LOGICAL_RENDER_WIDTH = 1200;

export type LandingSlideLayoutPreviewProps = {
  deckPalette: string;
  presentationScreen: {
    visualTone?: string;
    density?: string;
    lightTheme?: boolean;
  };
  /** Bumps ResizeObserver remeasure when layout option changes. */
  previewLayoutKey: string;
  /**
   * Width (px) at which slide content is laid out before scale-to-fit.
   * Match main slide builder canvas cap so wrapping matches the left canvas.
   */
  logicalRenderWidth?: number;
  children: React.ReactNode;
};

function LandingSlideLayoutPreviewInner({
  deckPalette,
  presentationScreen,
  previewLayoutKey,
  logicalRenderWidth = DEFAULT_LOGICAL_RENDER_WIDTH,
  children,
}: LandingSlideLayoutPreviewProps) {
  const paletteRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [scaledHeight, setScaledHeight] = useState<number | null>(null);

  useLayoutEffect(() => {
    const root = paletteRef.current;
    if (!root) return;
    const name = deckPalette.trim();
    if (!name) {
      applyPaletteToElement(root, getPaletteName());
    } else {
      const resolved = palettes[name] ? name : "default";
      applyPaletteToElement(root, resolved);
    }
  }, [deckPalette]);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setContainerWidth(el.offsetWidth));
    ro.observe(el);
    setContainerWidth(el.offsetWidth);
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    const outer = containerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner || containerWidth <= 0) return;

    const updateScaledHeight = () => {
      const w = containerRef.current?.offsetWidth ?? 0;
      if (w <= 0) return;
      const scale = w / logicalRenderWidth;
      const contentHeight = innerRef.current?.offsetHeight ?? 0;
      setScaledHeight(Math.ceil(contentHeight * scale));
    };

    updateScaledHeight();
    const ro = new ResizeObserver(updateScaledHeight);
    ro.observe(inner);
    return () => ro.disconnect();
  }, [containerWidth, previewLayoutKey, logicalRenderWidth, children]);

  const scale = containerWidth > 0 ? containerWidth / logicalRenderWidth : 1;

  const body =
    children != null ? (
      children
    ) : (
      <div
        style={{
          padding: 32,
          textAlign: "center",
          color: "#94a3b8",
          fontSize: 14,
          background: "#f8fafc",
        }}
      >
        No preview for this layout
      </div>
    );

  return (
    <div ref={paletteRef} style={{ width: "100%", minWidth: 0 }}>
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: scaledHeight != null ? scaledHeight : "auto",
          minHeight: scaledHeight == null ? 80 : undefined,
          overflow: "hidden",
          position: "relative",
          borderRadius: 8,
          background: "#f8fafc",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}
      >
        <div
          ref={innerRef}
          style={{
            width: logicalRenderWidth,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            pointerEvents: "none",
          }}
        >
          <div
            className="landing-screen-presentation"
            data-layout-preview="1"
            {...landingScreenPresentationAttrs({
              visualTone: presentationScreen.visualTone as "default" | "soft" | "bold" | undefined,
              density: presentationScreen.density as "comfortable" | "compact" | undefined,
            })}
          >
            {body}
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(LandingSlideLayoutPreviewInner);

type ErrorBoundaryState = { hasError: boolean };

/** Phase 4: isolate preview failures so one bad tile does not break the inspector. */
export class SlideLayoutPreviewErrorBoundary extends React.Component<
  { layoutLabel: string; children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(err: unknown) {
    if (typeof console !== "undefined") {
      console.warn("[SlideLayoutPreviewErrorBoundary]", this.props.layoutLabel, err);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: 12,
            fontSize: 11,
            color: "#64748b",
            background: "linear-gradient(145deg, #f1f5f9 0%, #e2e8f0 100%)",
            borderRadius: 8,
            textAlign: "center",
            lineHeight: 1.35,
          }}
        >
          Preview unavailable
          <div style={{ fontSize: 10, marginTop: 4, opacity: 0.85 }}>{this.props.layoutLabel}</div>
        </div>
      );
    }
    return this.props.children;
  }
}
