"use client";

import React from "react";
import { useSyncExternalStore } from "react";
import {
  getDevicePreviewMode,
  setDevicePreviewMode,
  subscribeDevicePreviewMode,
} from "./device-preview-store";
import {
  getPhoneFrameEnabled,
  setPhoneFrameEnabled,
  subscribePhoneFrameEnabled,
} from "./phone-frame-store";

/**
 * DevicePreviewToggle — Top header control
 * 
 * Renders in app-chrome header (not inside canvas).
 * Purely presentation-layer control.
 */
export default function DevicePreviewToggle() {
  const mode = useSyncExternalStore(
    subscribeDevicePreviewMode,
    getDevicePreviewMode,
    getDevicePreviewMode
  );

  const phoneFrameEnabled = useSyncExternalStore(
    subscribePhoneFrameEnabled,
    getPhoneFrameEnabled,
    getPhoneFrameEnabled
  );

  return (
    <div
      data-device-preview-toggle
      style={{
        display: "flex",
        gap: "4px",
        alignItems: "center",
      }}
    >
      {(["desktop", "tablet", "phone"] as const).map((deviceMode) => (
        <button
          key={deviceMode}
          type="button"
          onClick={() => setDevicePreviewMode(deviceMode)}
          style={{
            padding: "4px 12px",
            fontSize: "12px",
            fontWeight: mode === deviceMode ? 600 : 500,
            color: mode === deviceMode ? "#ffffff" : "#aaa",
            background: mode === deviceMode ? "#1976d2" : "transparent",
            border: mode === deviceMode ? "1px solid #1565c0" : "1px solid #444",
            borderRadius: "4px",
            cursor: "pointer",
            transition: "all 0.15s ease",
            textTransform: "capitalize",
          }}
          onMouseEnter={(e) => {
            if (mode !== deviceMode) {
              e.currentTarget.style.background = "#333";
            }
          }}
          onMouseLeave={(e) => {
            if (mode !== deviceMode) {
              e.currentTarget.style.background = "transparent";
            }
          }}
        >
          {deviceMode}
        </button>
      ))}
      
      <div style={{ width: "1px", height: "24px", background: "#444", margin: "0 4px" }} />
      
      <button
        type="button"
        onClick={() => setPhoneFrameEnabled(!phoneFrameEnabled)}
        style={{
          padding: "4px 12px",
          fontSize: "12px",
          fontWeight: phoneFrameEnabled ? 600 : 500,
          color: phoneFrameEnabled ? "#ffffff" : "#aaa",
          background: phoneFrameEnabled ? "#1976d2" : "transparent",
          border: phoneFrameEnabled ? "1px solid #1565c0" : "1px solid #444",
          borderRadius: "4px",
          cursor: "pointer",
          transition: "all 0.15s ease",
        }}
        onMouseEnter={(e) => {
          if (!phoneFrameEnabled) {
            e.currentTarget.style.background = "#333";
          }
        }}
        onMouseLeave={(e) => {
          if (!phoneFrameEnabled) {
            e.currentTarget.style.background = "transparent";
          }
        }}
      >
        Phone Frame
      </button>
    </div>
  );
}
