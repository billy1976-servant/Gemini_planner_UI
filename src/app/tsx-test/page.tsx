"use client";

import React, { useState } from "react";
import {
  ListOrganism,
  BoardOrganism,
  DashboardOrganism,
  EditorOrganism,
  TimelineOrganism,
  DetailOrganism,
  WizardOrganism,
  GalleryOrganism,
} from "@/components/organisms/tsx-organisms";

type StructureType = "list" | "board" | "dashboard" | "editor" | "timeline" | "detail" | "wizard" | "gallery";

const TYPES: StructureType[] = ["list", "board", "dashboard", "editor", "timeline", "detail", "wizard", "gallery"];

export default function TsxTestPage() {
  const [mode, setMode] = useState<StructureType>("list");

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      <nav
        style={{
          padding: "0.5rem 1rem",
          borderBottom: "1px solid #eee",
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem",
          alignItems: "center",
        }}
      >
        {TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setMode(t)}
            style={{ fontWeight: mode === t ? "bold" : "normal", textTransform: "capitalize" }}
          >
            {t}
          </button>
        ))}
      </nav>

      <main style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "auto" }}>
        {mode === "list" && <ListOrganism />}
        {mode === "board" && <BoardOrganism />}
        {mode === "dashboard" && <DashboardOrganism />}
        {mode === "editor" && <EditorOrganism />}
        {mode === "timeline" && <TimelineOrganism />}
        {mode === "detail" && <DetailOrganism />}
        {mode === "wizard" && <WizardOrganism />}
        {mode === "gallery" && <GalleryOrganism />}
      </main>
    </div>
  );
}
