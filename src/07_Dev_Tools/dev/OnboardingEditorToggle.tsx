"use client";

import React from "react";
import { useSyncExternalStore } from "react";
import {
  getOnboardingEditorEnabled,
  setOnboardingEditorEnabled,
  subscribeOnboardingEditorEnabled,
} from "./onboarding-editor-store";

/**
 * Toggle between Editor view (3-up cards) and User Preview (single step flow).
 * Only shown in layout when devMode=dev and screen is ContainerCreationsLanding-2.
 */
export default function OnboardingEditorToggle() {
  const enabled = useSyncExternalStore(
    subscribeOnboardingEditorEnabled,
    getOnboardingEditorEnabled,
    getOnboardingEditorEnabled
  );

  return (
    <div
      data-onboarding-editor-toggle
      style={{ display: "flex", gap: "2px", alignItems: "center" }}
    >
      <button
        type="button"
        onClick={() => setOnboardingEditorEnabled(true)}
        style={{
          padding: "4px 10px",
          fontSize: "12px",
          fontWeight: enabled ? 600 : 500,
          color: enabled ? "#fff" : "#aaa",
          background: enabled ? "#1976d2" : "transparent",
          border: enabled ? "1px solid #1565c0" : "1px solid #444",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        Editor
      </button>
      <button
        type="button"
        onClick={() => setOnboardingEditorEnabled(false)}
        style={{
          padding: "4px 10px",
          fontSize: "12px",
          fontWeight: !enabled ? 600 : 500,
          color: !enabled ? "#fff" : "#aaa",
          background: !enabled ? "#1976d2" : "transparent",
          border: !enabled ? "1px solid #1565c0" : "1px solid #444",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        Preview
      </button>
    </div>
  );
}
