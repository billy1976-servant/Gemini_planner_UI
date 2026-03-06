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
  const mode = useSyncExternalStore(
    subscribeDevicePreviewMode,
    getDevicePreviewMode,
    getDevicePreviewMode
  );

  // DESKTOP MODE — Full width, no frame
  if (mode === "desktop") {
    return (
      <div
        data-preview-stage="desktop-outer"
        style={{
          minHeight: "100vh",
          width: "100%",
          maxWidth: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          boxSizing: "border-box",
          overflowX: "hidden",
          padding: 20,
          margin: 0,
          background: CANVAS_BG,
        }}
      >
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

  // TABLET MODE — 768px centered frame
  if (mode === "tablet") {
    return (
      <div
        data-preview-stage="tablet-outer"
        style={{
          minHeight: "100vh",
          width: "100%",
          maxWidth: "100%",
          overflowX: "hidden",
          boxSizing: "border-box",
          padding: 20,
          margin: 0,
          background: CANVAS_BG,
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
        }}
      >
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

  // PHONE GRID MODE — 3 phone previews side-by-side
  if (mode === "phoneGrid") {
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
      <div
        data-preview-stage="phone-grid-outer"
        style={{
          minHeight: "100vh",
          width: "100%",
          maxWidth: "100%",
          overflowX: "hidden",
          boxSizing: "border-box",
          padding: 20,
          margin: 0,
          background: CANVAS_BG,
        }}
      >
        <div
          data-preview-frame="phone-grid"
          style={{
            width: "1200px",
            maxWidth: "100%",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(3, 390px)",
            gap: 20,
            justifyContent: "center",
            boxSizing: "border-box",
          }}
        >
          {[0, 1, 2].map((screenIndex) => (
            <div
              key={screenIndex}
              data-preview-frame="phone-device"
              data-phone-grid-index={screenIndex}
              style={phoneFrameStyle}
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

  // PHONE MODE — Centered 390px device shell
  return (
    <div
      data-preview-stage="phone-outer"
      style={{
        minHeight: "100vh",
        width: "100%",
        maxWidth: "100%",
        overflowX: "hidden",
        boxSizing: "border-box",
        padding: 20,
        margin: 0,
        background: CANVAS_BG,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
      }}
    >
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
          transition: "width 0.3s ease",
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
