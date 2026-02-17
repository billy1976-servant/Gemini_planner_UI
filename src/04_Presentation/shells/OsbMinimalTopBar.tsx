"use client";

import React, { useEffect, useState } from "react";

const REGISTRY_URL = "/api/screens/HiClarify/home/osb-home-registry.json";

type Registry = {
  topBar?: {
    profileLabel?: string;
    settingsLabel?: string;
    settingsTo?: string;
  };
};

function useRegistry() {
  const [registry, setRegistry] = useState<Registry | null>(null);
  useEffect(() => {
    fetch(REGISTRY_URL, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => setRegistry(json ?? null))
      .catch(() => setRegistry(null));
  }, []);
  return registry;
}

/**
 * Minimal top bar for OSB Home V2: text only, low contrast.
 * Left: profile name. Right: sync dot + Settings (word).
 * Labels from osb-home-registry.json; no icons.
 */
export default function OsbMinimalTopBar() {
  const registry = useRegistry();
  const topBar = registry?.topBar ?? {};
  const profileLabel = topBar.profileLabel ?? "Me";
  const settingsLabel = topBar.settingsLabel ?? "Settings";
  const settingsTo = topBar.settingsTo ?? "HiClarify/system_settings_screen";

  const goSettings = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("navigate", { detail: { to: settingsTo } }));
    }
  };

  return (
    <header
      role="banner"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 16px",
        minHeight: 44,
        background: "transparent",
        color: "var(--color-muted, #666)",
        fontSize: "13px",
        fontWeight: 400,
        borderBottom: "none",
      }}
      data-osb-top-bar
    >
      <span style={{ opacity: 0.9 }}>{profileLabel}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span
          title="Sync"
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "var(--color-muted, #999)",
            opacity: 0.7,
          }}
          aria-hidden
        />
        <button
          type="button"
          onClick={goSettings}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            font: "inherit",
            color: "inherit",
            cursor: "pointer",
            opacity: 0.9,
          }}
        >
          {settingsLabel}
        </button>
      </div>
    </header>
  );
}
