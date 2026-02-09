"use client";

import { useState, useCallback } from "react";

export type DockPanelId = "experience" | "mode" | "palette" | "template" | "styling" | "behavior" | "layout";

export function useDockState() {
  const [openPanel, setOpenPanel] = useState<DockPanelId | null>(null);

  const togglePanel = useCallback((panelId: DockPanelId) => {
    setOpenPanel((current) => (current === panelId ? null : panelId));
  }, []);

  const closePanel = useCallback(() => {
    setOpenPanel(null);
  }, []);

  return {
    openPanel,
    togglePanel,
    closePanel,
  };
}
