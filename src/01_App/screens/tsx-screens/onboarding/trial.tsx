"use client";

import React, { useState, useEffect } from "react";
import { loadScreen } from "@/engine/core/screen-loader";
import JsonScreenRenderer from "@/engine/core/json-renderer";
import { BeautifulSkin as BeautifulShell } from "@/ui/compounds/skins/beautiful-skin";

const SCREEN_PATH = "Onboarding/trial.json";

export default function TrialScreen() {
  const [screenTree, setScreenTree] = useState<any>(null);

  useEffect(() => {
    loadScreen(SCREEN_PATH).then(setScreenTree);
  }, []);

  if (screenTree === null) {
    return (
      <BeautifulShell>
        <div style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>
          Loading…
        </div>
      </BeautifulShell>
    );
  }

  return (
    <BeautifulShell>
      <JsonScreenRenderer node={screenTree} />
    </BeautifulShell>
  );
}


