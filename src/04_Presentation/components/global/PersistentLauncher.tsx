"use client";

import { useState } from "react";

/**
 * PersistentLauncher - FAB inside json-stage (desktop) or phone-frame-inner (phone frame on).
 * position: absolute; right: 16px; bottom: 16px relative to stage.
 */

export default function PersistentLauncher() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleLauncher = () => setIsOpen((prev) => !prev);

  const wrapperStyle: React.CSSProperties = {
    position: "absolute",
    bottom: 16,
    right: 16,
    zIndex: 999999,
    pointerEvents: "auto",
    display: "inline-block",
  };

  const fabStyle: React.CSSProperties = {
    background: "blue",
    width: "56px",
    height: "56px",
    minWidth: "56px",
    minHeight: "56px",
    borderRadius: "50%",
    border: "none",
    boxShadow: "0 4px 24px rgba(102, 126, 234, 0.4)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "auto",
    padding: "0",
    margin: "0",
    outline: "none",
  };

  const panelStyle: React.CSSProperties = {
    position: "absolute",
    right: 0,
    bottom: 56 + 16,
    zIndex: 20,
    background: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.24)",
    padding: "16px",
    minWidth: "200px",
    pointerEvents: "auto",
    border: "1px solid #e0e0e0",
  };

  const content = (
    <div data-render-source="shell" data-shell-layer="fab" style={wrapperStyle}>
      {/* Expanded Panel - shows when open */}
      {isOpen && (
        <div style={panelStyle}>
          <nav
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <a
              href="/?screen=journal"
              style={{
                padding: "12px 16px",
                borderRadius: "8px",
                textDecoration: "none",
                color: "#1a1a1a",
                background: "#f5f5f5",
                fontWeight: 500,
                fontSize: "14px",
                transition: "background 0.2s ease",
                display: "block",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#e8e8e8";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#f5f5f5";
              }}
            >
              📔 Journal
            </a>
            <a
              href="/?screen=learn"
              style={{
                padding: "12px 16px",
                borderRadius: "8px",
                textDecoration: "none",
                color: "#1a1a1a",
                background: "#f5f5f5",
                fontWeight: 500,
                fontSize: "14px",
                transition: "background 0.2s ease",
                display: "block",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#e8e8e8";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#f5f5f5";
              }}
            >
              📚 Learn
            </a>
            <a
              href="/?screen=apps"
              style={{
                padding: "12px 16px",
                borderRadius: "8px",
                textDecoration: "none",
                color: "#1a1a1a",
                background: "#f5f5f5",
                fontWeight: 500,
                fontSize: "14px",
                transition: "background 0.2s ease",
                display: "block",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#e8e8e8";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#f5f5f5";
              }}
            >
              🎯 Apps
            </a>
            <a
              href="/"
              style={{
                padding: "12px 16px",
                borderRadius: "8px",
                textDecoration: "none",
                color: "#1a1a1a",
                background: "#f5f5f5",
                fontWeight: 500,
                fontSize: "14px",
                transition: "background 0.2s ease",
                display: "block",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#e8e8e8";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#f5f5f5";
              }}
            >
              🏠 Home
            </a>
          </nav>
        </div>
      )}

      {/* Play Button - always visible */}
      <button
        data-play-fab
        onClick={toggleLauncher}
        title="Quick Launch Menu"
        style={fabStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.1)";
          e.currentTarget.style.boxShadow = "0 6px 32px rgba(102, 126, 234, 0.6)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 4px 24px rgba(102, 126, 234, 0.4)";
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 0.3s ease",
          }}
        >
          <path
            d="M8 5v14l11-7L8 5z"
            fill="white"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );

  return content;
}
