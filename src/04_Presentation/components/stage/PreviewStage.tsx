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

const CANVAS_BG = "var(--color-canvas, #f5f7fa)";

/**
 * PreviewStage — Full viewport canvas; editor and production show identical layout.
 * Device mode is exposed as data-device-mode for breakpoint simulation only; it does NOT resize the container.
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
    padding: 0,
    margin: 0,
    background: CANVAS_BG,
  };

  return (
    <div
      data-preview-stage="desktop-outer"
      data-device-mode={deviceMode}
      style={canvasOuterStyle}
    >
      <div
        data-preview-frame="desktop"
        style={{
          width: "100%",
          maxWidth: "none",
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
