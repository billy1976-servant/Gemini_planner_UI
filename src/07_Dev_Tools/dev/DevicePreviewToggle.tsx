"use client";

import React from "react";
import { useSyncExternalStore } from "react";
import { Monitor, Tablet, Smartphone, LayoutGrid } from "lucide-react";
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

const ICON_SIZE = 24;
const BUTTON_SIZE = 36;
const PADDING = 6;
const RADIUS = 6;

const DEVICE_MODES: Array<{
  id: "desktop" | "tablet" | "phone" | "phoneGrid";
  label: string;
  icon: React.ReactNode;
}> = [
  { id: "desktop", label: "Desktop", icon: <Monitor size={ICON_SIZE} strokeWidth={2} /> },
  { id: "tablet", label: "Tablet", icon: <Tablet size={ICON_SIZE} strokeWidth={2} /> },
  { id: "phone", label: "Phone", icon: <Smartphone size={ICON_SIZE} strokeWidth={2} /> },
  { id: "phoneGrid", label: "Phone grid", icon: <LayoutGrid size={ICON_SIZE} strokeWidth={2} /> },
];

/**
 * DevicePreviewToggle — icon toolbar in TopBar center.
 * Uses editor theme vars; no palette. 24px icons, 36px buttons, 6px padding/radius.
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
        gap: 6,
        alignItems: "center",
      }}
    >
      {DEVICE_MODES.map(({ id, label, icon }) => {
        const isActive = mode === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => setDevicePreviewMode(id)}
            title={label}
            aria-label={label}
            aria-pressed={isActive}
            style={{
              width: BUTTON_SIZE,
              height: BUTTON_SIZE,
              padding: PADDING,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: isActive ? "#fff" : "var(--editor-text-muted)",
              background: isActive ? "var(--editor-accent)" : "transparent",
              border: isActive ? "1px solid var(--editor-accent-hover)" : "1px solid var(--editor-border)",
              borderRadius: RADIUS,
              cursor: "pointer",
              transition: "all 0.15s ease",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                e.currentTarget.style.color = "var(--editor-text)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--editor-text-muted)";
              }
            }}
          >
            {icon}
          </button>
        );
      })}

      <div style={{ width: 1, height: 22, background: "var(--editor-border)", margin: "0 4px", flexShrink: 0 }} />

      <button
        type="button"
        onClick={() => setPhoneFrameEnabled(!phoneFrameEnabled)}
        title={phoneFrameEnabled ? "Hide phone frame" : "Show phone frame"}
        aria-label={phoneFrameEnabled ? "Hide phone frame" : "Show phone frame"}
        aria-pressed={phoneFrameEnabled}
        style={{
          width: BUTTON_SIZE,
          height: BUTTON_SIZE,
          padding: PADDING,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          color: phoneFrameEnabled ? "#fff" : "var(--editor-text-muted)",
          background: phoneFrameEnabled ? "var(--editor-accent)" : "transparent",
          border: phoneFrameEnabled ? "1px solid var(--editor-accent-hover)" : "1px solid var(--editor-border)",
          borderRadius: RADIUS,
          cursor: "pointer",
          transition: "all 0.15s ease",
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          if (!phoneFrameEnabled) {
            e.currentTarget.style.background = "rgba(255,255,255,0.08)";
            e.currentTarget.style.color = "var(--editor-text)";
          }
        }}
        onMouseLeave={(e) => {
          if (!phoneFrameEnabled) {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--editor-text-muted)";
          }
        }}
      >
        <Smartphone size={ICON_SIZE} strokeWidth={2} style={{ opacity: phoneFrameEnabled ? 1 : 0.8 }} />
      </button>
    </div>
  );
}
