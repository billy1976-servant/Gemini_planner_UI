"use client";

import React from "react";
import TopTextNav from "@/01_App/apps-tsx/HiClarify/TopTextNav";
import OSBBar from "@/01_App/apps-tsx/HiClarify/OSBBar";

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <TopTextNav />
      <OSBBar />
      <main
        style={{
          flex: 1,
          overflowY: "auto",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {children}
      </main>
    </div>
  );
}
