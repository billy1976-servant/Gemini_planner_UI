"use client";

import React, { useEffect } from "react";
import PipelineDiagnosticsRail from "@/app/ui/control-dock/PipelineDiagnosticsRail";
import RightFloatingSidebar from "@/app/ui/control-dock/RightFloatingSidebar";
import { enableDevInlineEditing } from "@/07_Dev_Tools/dev-inline-edit";

export default function DevLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    enableDevInlineEditing();
  }, []);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <PipelineDiagnosticsRail />
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
      <RightFloatingSidebar />
    </div>
  );
}
