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
          boxSizing: "border-box",
          maxWidth: "none", /* DEBUG: Stripped */
          overflowX: "hidden",
          padding: 0, /* DEBUG: Stripped */
          margin: 0, /* DEBUG: Stripped */
          border: "none", /* DEBUG: Stripped */
        }}
      >
        <div
          data-preview-frame="desktop"
          style={{
            width: "100%",
            maxWidth: "none", /* DEBUG: Stripped */
            margin: 0, /* DEBUG: Stripped */
            boxSizing: "border-box",
            overflowX: "hidden",
            padding: 0, /* DEBUG: Stripped */
            border: "none", /* DEBUG: Stripped */
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
          padding: 0, /* DEBUG: Stripped */
          boxSizing: "border-box",
          maxWidth: "none", /* DEBUG: Stripped */
          overflowX: "hidden",
          margin: 0, /* DEBUG: Stripped */
          border: "none", /* DEBUG: Stripped */
        }}
      >
        <div
          data-preview-frame="tablet"
          style={{
            width: "100%", /* DEBUG: Stripped constraint */
            maxWidth: "none", /* DEBUG: Stripped */
            minHeight: "calc(100vh - 64px)",
            background: "#ffffff",
            boxShadow: "none", /* DEBUG: Stripped */
            borderRadius: 0, /* DEBUG: Stripped */
            overflow: "hidden",
            transition: "width 0.3s ease",
            boxSizing: "border-box",
            padding: 0, /* DEBUG: Stripped */
            margin: 0, /* DEBUG: Stripped */
            border: "none", /* DEBUG: Stripped */
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
        padding: 0, /* DEBUG: Stripped */
        boxSizing: "border-box",
        maxWidth: "none", /* DEBUG: Stripped */
        overflowX: "hidden",
        margin: 0, /* DEBUG: Stripped */
        border: "none", /* DEBUG: Stripped */
      }}
    >
      <div
        data-preview-frame="phone-device"
        style={{
          position: "relative",
          width: "100%", /* DEBUG: Stripped constraint */
          maxWidth: "none", /* DEBUG: Stripped */
          margin: 0, /* DEBUG: Stripped */
          minHeight: "calc(100vh - 96px)",
          background: "#1a1a1a",
          borderRadius: 0, /* DEBUG: Stripped */
          padding: 0, /* DEBUG: Stripped */
          boxShadow: "none", /* DEBUG: Stripped */
          transition: "width 0.3s ease",
          boxSizing: "border-box",
          border: "none", /* DEBUG: Stripped */
        }}
      >
        <div
          data-preview-frame="phone-screen"
          style={{
            width: "100%",
            minHeight: "calc(100vh - 120px)",
            background: "#ffffff",
            borderRadius: 0, /* DEBUG: Stripped */
            overflow: "hidden",
            boxShadow: "none", /* DEBUG: Stripped */
            boxSizing: "border-box",
            padding: 0, /* DEBUG: Stripped */
            margin: 0, /* DEBUG: Stripped */
            border: "none", /* DEBUG: Stripped */
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
