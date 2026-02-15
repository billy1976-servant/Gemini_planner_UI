"use client";

import React from "react";
import { BottomNav } from "./BottomNav";

/**
 * Mobile-only layout: app UI + fixed bottom nav. No sidebars, no dev chrome.
 * Bottom nav is locked to the screen (position: fixed), never scrolls.
 */
export default function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <main
        style={{
          flex: 1,
          overflowY: "auto",
          paddingBottom: "calc(72px + env(safe-area-inset-bottom))",
        }}
      >
        {children}
      </main>

      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 99999,
          background: "var(--app-bg, white)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <BottomNav />
      </div>
    </div>
  );
}
