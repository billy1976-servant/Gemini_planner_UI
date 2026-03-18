"use client";

import React from "react";
import { useSyncExternalStore } from "react";
import {
  getEditorMode,
  setEditorMode,
  subscribeEditorMode,
} from "./editor-mode-store";
import { isEditorCapable } from "./editor-capable-screens";

type Props = { screenPath: string };

/**
 * Editor / Preview toggle. Only renders when the current screen supports editor mode.
 */
export default function EditorPreviewToggle({ screenPath }: Props) {
  const decoded = typeof screenPath === "string" ? decodeURIComponent(screenPath) : "";
  if (!isEditorCapable(decoded)) return null;

  const current = useSyncExternalStore(
    subscribeEditorMode,
    getEditorMode,
    getEditorMode
  );

  return (
    <div
      data-editor-preview-toggle
      style={{ display: "flex", gap: "2px", alignItems: "center" }}
    >
      {(["editor", "preview"] as const).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => setEditorMode(m)}
          style={{
            padding: "4px 10px",
            fontSize: "12px",
            fontWeight: current === m ? 600 : 500,
            color: current === m ? "#fff" : "#aaa",
            background: current === m ? "#1976d2" : "transparent",
            border: current === m ? "1px solid #1565c0" : "1px solid #444",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          {m === "editor" ? "Editor" : "Preview"}
        </button>
      ))}
    </div>
  );
}
