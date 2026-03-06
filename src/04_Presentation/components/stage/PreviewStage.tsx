"use client";

import React from "react";
import { useSyncExternalStore } from "react";
import {
  getDevicePreviewMode,
  subscribeDevicePreviewMode,
} from "@/dev/device-preview-store";

type PreviewStageProps = {
  children: React.ReactNode;
};

const PHONE_FRAME_WIDTH = 390;
const CANVAS_BG = "var(--color-canvas, #f5f7fa)";

/**
 * PreviewStage — Professional device preview wrapper
 * 
 * MODES:
 * - Desktop: Full responsive canvas (no frame, true website behavior)
 * - Tablet: 768px centered frame with soft shadow
 * - Phone: 390px centered device shell with drop shadow
 * - PhoneGrid: 3 phone previews side-by-side (1200px grid)
 * 
 * STRICT NON-DESTRUCTIVE RULES:
 * - Does NOT modify JSON screens
 * - Does NOT change palettes
 * - Does NOT alter layout definitions
 * - Does NOT inject styles into content
 * - Does NOT change rendering logic
 * 
 * This is a pure presentation shell.
 */
export default function PreviewStage({ children }: PreviewStageProps) {
  const deviceMode = useSyncExternalStore(
    subscribeDevicePreviewMode,
    getDevicePreviewMode,
    getDevicePreviewMode
  );

  const canvasOuterStyle: React.CSSProperties = {
    minHeight: "100vh",
    width: "100%",
    maxWidth: "100%",
    overflowX: "hidden",
    boxSizing: "border-box",
    padding: 20,
    margin: 0,
    background: CANVAS_BG,
  };

  // PHONE GRID — only mode that uses grid; renders three previews
  if (deviceMode === "phoneGrid") {
    const phoneFrameStyle: React.CSSProperties = {
      position: "relative",
      width: PHONE_FRAME_WIDTH,
      maxWidth: "100%",
      minHeight: "calc(100vh - 96px)",
      background: "#1a1a1a",
      borderRadius: "32px",
      padding: "12px",
      boxShadow: "0 16px 48px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.3)",
      boxSizing: "border-box",
    };
    const phoneScreenStyle: React.CSSProperties = {
      width: "100%",
      minHeight: "calc(100vh - 120px)",
      background: "#ffffff",
      borderRadius: "24px",
      overflow: "hidden",
      boxSizing: "border-box",
      padding: 0,
      margin: 0,
    };
    return (
      <div data-preview-stage="phone-grid-outer" style={canvasOuterStyle}>
        <div
          data-preview-frame="phone-grid"
          style={{
            maxWidth: "1200px",
            width: "100%",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(3, 390px)",
            gap: 24,
            justifyContent: "center",
            boxSizing: "border-box",
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              data-preview-frame="phone-device"
              data-phone-grid-index={i}
              style={{ ...phoneFrameStyle, margin: "0 auto" }}
            >
              <div data-preview-frame="phone-screen" style={phoneScreenStyle}>
                {children}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // PHONE — single phone frame (no grid)
  if (deviceMode === "phone") {
    return (
      <div data-preview-stage="phone-outer" style={{ ...canvasOuterStyle, display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
        <div
          data-preview-frame="phone-device"
          style={{
            position: "relative",
            width: "390px",
            maxWidth: "100%",
            margin: "0 auto",
            minHeight: "calc(100vh - 96px)",
            background: "#1a1a1a",
            borderRadius: "32px",
            padding: "12px",
            boxShadow: "0 16px 48px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.3)",
            boxSizing: "border-box",
          }}
        >
          <div
            data-preview-frame="phone-screen"
            style={{
              width: "100%",
              minHeight: "calc(100vh - 120px)",
              background: "#ffffff",
              borderRadius: "24px",
              overflow: "hidden",
              boxSizing: "border-box",
              padding: 0,
              margin: 0,
            }}
          >
            {children}
          </div>
        </div>
      </div>
    );
  }

  // TABLET — single tablet frame (no grid)
  if (deviceMode === "tablet") {
    return (
      <div data-preview-stage="tablet-outer" style={{ ...canvasOuterStyle, display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
        <div
          data-preview-frame="tablet"
          style={{
            width: "768px",
            maxWidth: "100%",
            margin: "0 auto",
            minHeight: "calc(100vh - 64px)",
            background: "#ffffff",
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            borderRadius: "12px",
            overflow: "hidden",
            boxSizing: "border-box",
            padding: 0,
          }}
        >
          {children}
        </div>
      </div>
    );
  }

  // DESKTOP (default) — single full-width preview (no grid)
  return (
    <div data-preview-stage="desktop-outer" style={{ ...canvasOuterStyle, display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
      <div
        data-preview-frame="desktop"
        style={{
          width: "100%",
          maxWidth: "100%",
          margin: "0 auto",
          boxSizing: "border-box",
          overflowX: "hidden",
          padding: 0,
        }}
      >
        {children}
      </div>
    </div>
  );
}
