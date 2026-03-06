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

  const deviceModes: Array<{ id: "desktop" | "tablet" | "phone" | "phoneGrid"; label: string; icon?: React.ReactNode }> = [
    { id: "desktop", label: "Desktop" },
    { id: "tablet", label: "Tablet" },
    { id: "phone", label: "Phone" },
    {
      id: "phoneGrid",
      label: "Phone Grid",
      icon: (
        <span style={{ display: "inline-flex", gap: 2, alignItems: "center", marginRight: 4 }} aria-hidden>
          <span style={{ width: 6, height: 10, background: "currentColor", borderRadius: 1, opacity: 0.9 }} />
          <span style={{ width: 6, height: 10, background: "currentColor", borderRadius: 1, opacity: 0.9 }} />
          <span style={{ width: 6, height: 10, background: "currentColor", borderRadius: 1, opacity: 0.9 }} />
        </span>
      ),
    },
  ];

  return (
    <div
      data-device-preview-toggle
      style={{
        display: "flex",
        gap: "4px",
        alignItems: "center",
      }}
    >
      {deviceModes.map(({ id, label, icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => setDevicePreviewMode(id)}
          style={{
            padding: "4px 12px",
            fontSize: "12px",
            fontWeight: mode === id ? 600 : 500,
            color: mode === id ? "#ffffff" : "#aaa",
            background: mode === id ? "#1976d2" : "transparent",
            border: mode === id ? "1px solid #1565c0" : "1px solid #444",
            borderRadius: "4px",
            cursor: "pointer",
            transition: "all 0.15s ease",
            display: "inline-flex",
            alignItems: "center",
          }}
          onMouseEnter={(e) => {
            if (mode !== id) {
              e.currentTarget.style.background = "#333";
            }
          }}
          onMouseLeave={(e) => {
            if (mode !== id) {
              e.currentTarget.style.background = "transparent";
            }
          }}
        >
          {icon}
          {label}
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
