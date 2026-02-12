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

/**
 * PreviewStage — Professional device preview wrapper
 * 
 * MODES:
 * - Desktop: Full responsive canvas (no frame, true website behavior)
 * - Tablet: 768px centered frame with soft shadow
 * - Phone: 390px centered device shell with drop shadow
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

  // DESKTOP MODE — Centered with max-width constraint
  if (mode === "desktop") {
    return (
      <div
        data-preview-stage="desktop-outer"
        style={{
          minHeight: "100vh",
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
        }}
      >
        <div
          data-preview-frame="desktop"
          style={{
            width: "100%",
            maxWidth: "1100px",
            margin: "0 auto",
          }}
        >
          {children}
        </div>
      </div>
    );
  }

  // TABLET MODE — Centered 768px frame
  if (mode === "tablet") {
    return (
      <div
        data-preview-stage="tablet-outer"
        style={{
          minHeight: "100vh",
          width: "100%",
          background: "linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "32px 16px",
        }}
      >
        <div
          data-preview-frame="tablet"
          style={{
            width: "768px",
            maxWidth: "100%",
            minHeight: "calc(100vh - 64px)",
            background: "#ffffff",
            boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)",
            borderRadius: "12px",
            overflow: "hidden",
            transition: "width 0.3s ease",
          }}
        >
          {children}
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
        background: "linear-gradient(135deg, #2d3436 0%, #1e272e 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "48px 16px",
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
            boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.1)",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
