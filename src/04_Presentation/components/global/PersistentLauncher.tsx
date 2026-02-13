"use client";

import { useState, useEffect } from "react";
import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { getPhoneFrameEnabled, subscribePhoneFrameEnabled } from "@/dev/phone-frame-store";

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
const FAB_INSET = 24;

export default function PersistentLauncher() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const phoneFrameEnabled = useSyncExternalStore(subscribePhoneFrameEnabled, getPhoneFrameEnabled, getPhoneFrameEnabled);
  const [fabPosition, setFabPosition] = useState({ right: FAB_INSET, bottom: FAB_INSET });

  useEffect(() => {
    setMounted(true);
    if (process.env.NODE_ENV === "development") {
      console.log("[PersistentLauncher] Component mounted");
    }
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development" || !mounted) return;
    const run = () => {
      const fab = document.querySelector("[data-play-fab]");
      const frame = document.querySelector("[data-phone-frame]");
      if (!fab || !(fab instanceof HTMLElement)) return;
      const rect = fab.getBoundingClientRect();
      const cs = window.getComputedStyle(fab);
      const chain: Array<{ el: string; offsetLeft: number; offsetTop: number }> = [];
      let el: HTMLElement | null = fab;
      while (el) {
        chain.push({ el: el.tagName + (el.id ? "#" + el.id : ""), offsetLeft: el.offsetLeft, offsetTop: el.offsetTop });
        el = el.offsetParent as HTMLElement | null;
      }
      console.group("[Step A] Play FAB");
      console.log("getBoundingClientRect", { left: rect.left, top: rect.top, width: rect.width, height: rect.height, right: rect.right, bottom: rect.bottom });
      console.log("computed position", cs.position, "zIndex", cs.zIndex);
      console.log("offsetParent chain", chain);
      if (frame) {
        console.log("phone frame rect", frame.getBoundingClientRect());
      }
      console.groupEnd();
    };
    const t = setTimeout(run, 150);
    return () => clearTimeout(t);
  }, [mounted]);

  useEffect(() => {
    const update = () => {
      if (!phoneFrameEnabled) {
        setFabPosition({ right: FAB_INSET, bottom: FAB_INSET });
        return;
      }
      const frame = document.querySelector("[data-phone-frame]");
      if (!frame) {
        setFabPosition({ right: FAB_INSET, bottom: FAB_INSET });
        return;
      }
      const r = frame.getBoundingClientRect();
      setFabPosition({
        right: window.innerWidth - r.right + FAB_INSET,
        bottom: window.innerHeight - r.bottom + FAB_INSET + 48,
      });
    };
    update();
    const t = phoneFrameEnabled ? setTimeout(update, 150) : undefined;
    window.addEventListener("resize", update);
    return () => {
      if (t) clearTimeout(t);
      window.removeEventListener("resize", update);
    };
  }, [phoneFrameEnabled]);

  const toggleLauncher = () => {
    setIsOpen((prev) => !prev);
    if (process.env.NODE_ENV === "development") {
      console.log("[PersistentLauncher] Toggle:", !isOpen);
    }
  };

  if (!mounted) return null;

  const content = (
    <>
      {/* Expanded Panel - shows when open */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            right: `${fabPosition.right}px`,
            bottom: `${fabPosition.bottom + 56 + 16}px`,
            zIndex: 99999,
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
        data-play-fab
        onClick={toggleLauncher}
        title="Quick Launch Menu"
        style={{
          position: "fixed",
          right: `${fabPosition.right}px`,
          bottom: `${fabPosition.bottom}px`,
          zIndex: 100000,
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
