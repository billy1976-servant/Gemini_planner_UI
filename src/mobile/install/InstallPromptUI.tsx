"use client";

import { useInstallPrompt } from "./useInstallPrompt";

export default function InstallPromptUI() {
  const { canInstall, isStandalone, showIosHint, showAndroidHint, handleInstallClick } = useInstallPrompt();

  if (isStandalone) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
      {canInstall && (
        <button
          type="button"
          onClick={handleInstallClick}
          style={{
            padding: "6px 12px",
            fontSize: 12,
            border: "1px solid #333",
            borderRadius: 6,
            background: "#fff",
            cursor: "pointer",
          }}
        >
          Install App
        </button>
      )}
      {showIosHint && (
        <span style={{ fontSize: 11, color: "#666", maxWidth: 160 }}>
          Share → Add to Home Screen
        </span>
      )}
      {showAndroidHint && !canInstall && (
        <span style={{ fontSize: 11, color: "#666", maxWidth: 160 }}>
          Menu ⋮ → Add to Home screen
        </span>
      )}
    </div>
  );
}
