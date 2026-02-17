"use client";

import React from "react";
import { BottomNav } from "./BottomNav";

/**
 * Mobile-only layout: app UI + fixed bottom nav when showBottomNav is true.
 * On home (OSB V2) bottom nav is hidden for a calm, text-first surface.
 */
export default function MobileLayout({
  children,
  showBottomNav = true,
}: {
  children: React.ReactNode;
  showBottomNav?: boolean;
}) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <main
        style={{
          flex: 1,
          overflowY: "auto",
          paddingBottom: showBottomNav ? "calc(72px + env(safe-area-inset-bottom))" : "env(safe-area-inset-bottom)",
        }}
      >
        {children}
      </main>

      {showBottomNav && (
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
      )}
    </div>
  );
}
