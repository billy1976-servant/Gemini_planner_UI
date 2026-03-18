"use client";
import React, { useState, useMemo } from "react";
import JsonRenderer from "@/engine/core/json-renderer";
import { loadScreenJson } from "@/runtime/loaders/safe-json-loader";

import screenManifest from "@/runtime/registry/screen-manifest.json";

type ScreenKey = keyof typeof screenManifest;

const SCREEN_PATHS: Record<ScreenKey, string> = screenManifest as Record<ScreenKey, string>;

function MissingScreenNotice({ screen }: { screen: string }) {
  return (
    <div
      style={{
        padding: 24,
        textAlign: "center",
        color: "#94a3b8",
        border: "1px dashed #475569",
        borderRadius: 8,
        marginTop: 16,
      }}
    >
      Screen &quot;{screen}&quot; not available (file missing or removed).
    </div>
  );
}

export default function MultiJsonScreen() {
  const [active, setActive] = useState<ScreenKey>("onboarding");

  const screenJson = useMemo(
    () => loadScreenJson(SCREEN_PATHS[active]),
    [active]
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(1200px 600px at 20% 0%, #1e293b 0%, #020617 60%)",
        color: "#e5e7eb",
        padding: 24,
      }}
    >
      {/* TEMP CONTROL BAR — proves switching works */}
      <div style={{ marginBottom: 16, display: "flex", gap: 8 }}>
        <button onClick={() => setActive("onboarding")}>Onboarding</button>
        <button onClick={() => setActive("calculator")}>Calculator</button>
        <button onClick={() => setActive("education")}>Education</button>
      </div>

      {/* JSON RENDER — fallback when screen file is missing */}
      {screenJson === null ? (
        <MissingScreenNotice screen={active} />
      ) : (
        <JsonRenderer node={screenJson} />
      )}
    </div>
  );
}
