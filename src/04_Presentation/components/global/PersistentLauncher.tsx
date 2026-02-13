"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

/**
 * PersistentLauncher - Global UI overlay that persists across all screens
 * 
 * REQUIREMENTS:
 * - Always visible on every screen
 * - Independent of JSON rendering and PreviewStage
 * - Lives at ROOT app shell level
 * - Renders above all screens using z-index
 * - Does NOT affect layout flow
 * 
 * STRUCTURE:
 * - Circular play button (bottom-right)
 * - On click: expand panel with 4 links
 * - Fixed position with high z-index
 */
export default function PersistentLauncher() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    console.log("[PersistentLauncher] Component mounted");
  }, []);

  const toggleLauncher = () => {
    setIsOpen((prev) => !prev);
    console.log("[PersistentLauncher] Toggle:", !isOpen);
  };

  if (!mounted) return null;

  const content = (
    <>
      {/* Expanded Panel - shows when open */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            right: "24px",
            bottom: "88px",
            zIndex: "9998",
            background: "#ffffff",
            borderRadius: "12px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.24)",
            padding: "16px",
            minWidth: "200px",
            pointerEvents: "auto",
            border: "1px solid #e0e0e0",
          }}
        >
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
        onClick={toggleLauncher}
        title="Quick Launch Menu"
        style={{
          position: "fixed",
          right: "24px",
          bottom: "24px",
          zIndex: "9999",
          width: "56px",
          height: "56px",
          minWidth: "56px",
          minHeight: "56px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          border: "none",
          boxShadow: "0 4px 24px rgba(102, 126, 234, 0.4)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.3s ease",
          pointerEvents: "auto",
          padding: "0",
          margin: "0",
          outline: "none",
        }}
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
    </>
  );

  return createPortal(content, document.body);
}
