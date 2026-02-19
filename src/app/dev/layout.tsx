"use client";

import React from "react";
import PipelineDiagnosticsRail from "@/app/ui/control-dock/PipelineDiagnosticsRail";
import RightFloatingSidebar from "@/app/ui/control-dock/RightFloatingSidebar";

export default function DevLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <PipelineDiagnosticsRail />
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
      <RightFloatingSidebar />
    </div>
  );
}
